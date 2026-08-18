"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server-auth";
import { priceLines } from "@/lib/cart-actions";
import { checkPincode } from "@/lib/delivery";
import { getStoreStatus } from "@/lib/store-status";
import { sendNewOrderEmail, sendOrderConfirmationEmail } from "@/lib/notify";
import { pushNewOrder } from "@/lib/telegram";
import {
  hasErrors,
  validateOrder,
  type FieldErrors,
  type OrderInput,
} from "@/lib/order-schema";

export type CheckoutState = { errors?: FieldErrors; formError?: string };

type SubmittedLine = {
  productId: number;
  variantLabel: string | null;
  quantity: number;
  colour?: string;
  cakeMessage?: string;
};

/**
 * Turn the basket into a single order with several lines.
 *
 * The browser sends only *which* cakes and how many. Every price is
 * re-read from the database here, so a tampered localStorage basket
 * cannot change what anything costs, and a cake that has since been
 * unpublished simply drops out.
 */
export async function placeCartOrder(
  _prev: CheckoutState,
  formData: FormData
): Promise<CheckoutState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { formError: "Your sign-in expired. Please sign in and try again." };
  }


  // The buttons are hidden while closed, but a form could still be
  // submitted from a stale page. This is the check that actually stops
  // an order arriving after the kitchen has shut.
  const store = await getStoreStatus();
  if (!store.acceptingOrders) {
    return { formError: store.message };
  }

  let submitted: SubmittedLine[];
  try {
    submitted = JSON.parse(String(formData.get("lines") ?? "[]"));
    if (!Array.isArray(submitted) || submitted.length === 0) {
      return { formError: "Your basket is empty." };
    }
  } catch {
    return { formError: "Something went wrong with your basket. Please reload." };
  }

  const lines = await priceLines(
    submitted.map((l) => ({
      productId: Number(l.productId),
      variantLabel: l.variantLabel ?? null,
      quantity: Number(l.quantity) || 1,
      colour: typeof l.colour === "string" ? l.colour.slice(0, 100) : undefined,
      cakeMessage:
        typeof l.cakeMessage === "string" ? l.cakeMessage.slice(0, 60) : undefined,
    }))
  );

  if (lines.length === 0) {
    return {
      formError:
        "None of those cakes are available any more. Please check your basket.",
    };
  }

  const input: OrderInput = {
    variantLabel: "",
    // Validated per line below; this satisfies the shared validator,
    // which was written for the single-cake form.
    quantity: 1,
    colour: "",
    cakeMessage: "",
    specialInstructions: str(formData.get("specialInstructions")).trim(),
    fulfillmentType:
      formData.get("fulfillmentType") === "delivery" ? "delivery" : "pickup",
    address: str(formData.get("address")).trim(),
    landmark: str(formData.get("landmark")).trim(),
    city: str(formData.get("city")).trim(),
    pincode: str(formData.get("pincode")).trim(),
    latitude: numOrNull(formData.get("latitude")),
    longitude: numOrNull(formData.get("longitude")),
    preferredDate: str(formData.get("preferredDate")),
    preferredTime: str(formData.get("preferredTime")),
    contactName: str(formData.get("contactName")).trim(),
    contactPhone: str(formData.get("contactPhone")).trim(),
  };

  const errors = validateOrder(input);
  if (hasErrors(errors)) return { errors };

  const isDelivery = input.fulfillmentType === "delivery";

  if (isDelivery) {
    const area = await checkPincode(input.pincode);
    if (!area.serviceable) {
      return {
        errors: {
          pincode:
            "We don't deliver to that pincode. Please choose pickup, or arrange your own courier.",
        },
      };
    }
  }

  const estimatedTotal = lines.reduce(
    (sum, l) => sum + l.unitPrice * l.quantity,
    0
  );
  const totalCakes = lines.reduce((sum, l) => sum + l.quantity, 0);

  // `orders.product_name` predates baskets and is NOT NULL. A summary
  // keeps every existing screen — including Leo Billing's order list —
  // readable, while order_items carries the real detail.
  const summary =
    lines.length === 1
      ? lines[0].name
      : `${lines[0].name} + ${lines.length - 1} more`;

  await supabase
    .from("website_customers")
    .upsert(
      { id: user.id, full_name: input.contactName, phone: input.contactPhone },
      { onConflict: "id" }
    );

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      customer_id: user.id,
      product_id: lines.length === 1 ? lines[0].productId : null,
      product_name: summary,
      variant: lines.length === 1 ? { size: lines[0].variantLabel } : {},
      variant_label: lines.length === 1 ? lines[0].variantLabel : null,
      quantity: totalCakes,
      unit_price: lines.length === 1 ? lines[0].unitPrice : null,
      estimated_total: estimatedTotal,
      special_instructions: input.specialInstructions || null,
      fulfillment_type: input.fulfillmentType,
      address: isDelivery ? input.address || null : null,
      landmark: isDelivery ? input.landmark || null : null,
      city: isDelivery ? input.city || null : null,
      pincode: isDelivery ? input.pincode || null : null,
      latitude: isDelivery ? input.latitude : null,
      longitude: isDelivery ? input.longitude : null,
      preferred_date: input.preferredDate,
      preferred_time: input.preferredTime || null,
      contact_name: input.contactName,
      contact_phone: input.contactPhone,
      contact_email: user.email ?? null,
      status: "received",
    })
    .select("id, order_no")
    .single();

  if (error || !order) {
    console.error("[placeCartOrder]", error);
    return {
      formError:
        "We couldn't submit your order right now. Please try again in a moment.",
    };
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    lines.map((l) => ({
      order_id: order.id,
      product_id: l.productId,
      product_name: l.name,
      variant_label: l.variantLabel,
      unit_price: l.unitPrice,
      quantity: l.quantity,
      line_total: l.unitPrice * l.quantity,
      colour: l.colour ?? null,
      cake_message: l.cakeMessage ?? null,
    }))
  );

  if (itemsError) {
    // The order header exists but has no lines — worse than failing
    // outright, because the owner would see an order with no cakes in
    // it. Remove it and ask the customer to retry.
    console.error("[placeCartOrder] items failed, rolling back:", itemsError);
    await supabase.from("orders").delete().eq("id", order.id);
    return {
      formError:
        "We couldn't save every cake in your basket. Nothing was ordered — please try again.",
    };
  }

  // Basket has become an order; empty it.
  await supabase.from("cart_items").delete().eq("customer_id", user.id);

  const emailData = {
    orderNo: order.order_no,
    productName: lines
      .map((l) => `${l.name}${l.variantLabel ? ` (${l.variantLabel})` : ""} × ${l.quantity}`)
      .join(", "),
    variantLabel: null,
    quantity: totalCakes,
    estimatedTotal,
    customerName: input.contactName,
    customerPhone: input.contactPhone,
    customerEmail: user.email ?? null,
    fulfillmentType: input.fulfillmentType,
    preferredDate: input.preferredDate,
    preferredTime: input.preferredTime || null,
    cakeMessage:
      lines
        .filter((l) => l.cakeMessage)
        .map((l) => `${l.name}: “${l.cakeMessage}”`)
        .join(" · ") || null,
    specialInstructions: input.specialInstructions || null,
    address: isDelivery
      ? [input.address, input.landmark, input.city, input.pincode]
          .filter(Boolean)
          .join(", ") || null
      : null,
    mapsLink:
      isDelivery && input.latitude && input.longitude
        ? `https://www.google.com/maps/search/?api=1&query=${input.latitude},${input.longitude}`
        : null,
  };

  // Notifications are all best-effort and run together. The order is
  // already saved; none of these failing should cost the customer their
  // order, so nothing here is awaited for its result.
  await Promise.allSettled([
    sendNewOrderEmail(emailData),
    sendOrderConfirmationEmail(emailData),
    pushNewOrder({
      id: order.id,
      orderNo: order.order_no,
      contactName: input.contactName,
      contactPhone: input.contactPhone,
      status: "received",
      fulfillmentType: input.fulfillmentType,
      preferredDate: input.preferredDate,
      preferredTime: input.preferredTime || null,
      estimatedTotal,
      specialInstructions: input.specialInstructions || null,
      address: emailData.address,
      latitude: isDelivery ? input.latitude : null,
      longitude: isDelivery ? input.longitude : null,
      items: lines.map((l) => ({
        name: l.name,
        variantLabel: l.variantLabel,
        quantity: l.quantity,
        colour: l.colour ?? null,
        cakeMessage: l.cakeMessage ?? null,
      })),
    }),
  ]);

  redirect(`/account/orders?placed=${encodeURIComponent(order.order_no)}`);
}

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v : "";
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  const n = Number(v);
  return typeof v === "string" && v !== "" && Number.isFinite(n) ? n : null;
}
