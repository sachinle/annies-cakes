import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendOrderStatusEmail } from "@/lib/notify";
import type { OrderForTelegram } from "@/lib/telegram";

// Owner-side order operations, shared by the Leo Billing CMS endpoint
// and the Telegram bot.
//
// Both surfaces change order status, and they must behave identically:
// same allowed values, same history row, same customer email. Keeping
// one implementation is the point — two copies would drift, and the
// customer-facing timeline would start depending on which device the
// owner happened to use.

export const ORDER_STATUSES = [
  "received",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
  "cancelled",
] as const;

export type AdminOrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(v: string): v is AdminOrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(v);
}

export type SetStatusResult =
  | { ok: true; orderNo: string; emailed: boolean }
  | { ok: false; reason: string };

/**
 * Move an order to a new status, record it on the customer's timeline,
 * and email them.
 *
 * The email is best-effort: the status has already been saved by the
 * time it is attempted, so a mail failure must not be reported as a
 * failed status change.
 */
export async function setOrderStatus(
  orderId: string,
  status: string
): Promise<SetStatusResult> {
  if (!isOrderStatus(status)) return { ok: false, reason: "Unknown status." };

  const db = getSupabaseAdmin();

  const { data: updated, error } = await db
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select("order_no, product_name, contact_name, contact_email")
    .single();

  if (error || !updated) {
    console.error("[setOrderStatus]", error);
    return { ok: false, reason: "That order no longer exists." };
  }

  await db.from("order_status_history").insert([{ order_id: orderId, status }]);

  const emailed = await sendOrderStatusEmail({
    status,
    orderNo: updated.order_no,
    productName: updated.product_name,
    customerName: updated.contact_name ?? "there",
    customerEmail: updated.contact_email,
    reviewUrl: process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL,
  });

  return { ok: true, orderNo: updated.order_no, emailed };
}

const ORDER_SELECT = `
  id, order_no, contact_name, contact_phone, status, fulfillment_type,
  preferred_date, preferred_time, estimated_total, special_instructions,
  address, latitude, longitude,
  order_items ( product_name, variant_label, quantity, colour, cake_message )
`;

type Row = {
  id: string;
  order_no: string;
  contact_name: string | null;
  contact_phone: string | null;
  status: string;
  fulfillment_type: string;
  preferred_date: string | null;
  preferred_time: string | null;
  estimated_total: number | null;
  special_instructions: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  order_items: Array<{
    product_name: string;
    variant_label: string | null;
    quantity: number;
    colour: string | null;
    cake_message: string | null;
  }> | null;
};

function toTelegram(r: Row): OrderForTelegram {
  return {
    id: r.id,
    orderNo: r.order_no,
    contactName: r.contact_name ?? "—",
    contactPhone: r.contact_phone ?? "—",
    status: r.status,
    fulfillmentType: r.fulfillment_type,
    preferredDate: r.preferred_date,
    preferredTime: r.preferred_time,
    estimatedTotal: r.estimated_total,
    specialInstructions: r.special_instructions,
    address: r.address,
    latitude: r.latitude,
    longitude: r.longitude,
    items: (r.order_items ?? []).map((i) => ({
      name: i.product_name,
      variantLabel: i.variant_label,
      quantity: i.quantity,
      colour: i.colour,
      cakeMessage: i.cake_message,
    })),
  };
}

export async function getOrderForBot(orderId: string): Promise<OrderForTelegram | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", orderId)
    .single();

  if (error || !data) return null;
  return toTelegram(data as Row);
}

export async function getOrderByNo(orderNo: string): Promise<OrderForTelegram | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("orders")
    .select(ORDER_SELECT)
    .ilike("order_no", orderNo)
    .maybeSingle();

  if (error || !data) return null;
  return toTelegram(data as Row);
}

/** Orders still needing attention, oldest first — the kitchen queue. */
export async function getOpenOrders(limit = 10): Promise<OrderForTelegram[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("orders")
    .select(ORDER_SELECT)
    .not("status", "in", "(completed,cancelled)")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !data) return [];
  return (data as Row[]).map(toTelegram);
}

/** Everything due on a given day, whatever its status. */
export async function getOrdersForDate(date: string): Promise<OrderForTelegram[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("orders")
    .select(ORDER_SELECT)
    .eq("preferred_date", date)
    .neq("status", "cancelled")
    .order("preferred_time", { ascending: true })
    .limit(25);

  if (error || !data) return [];
  return (data as Row[]).map(toTelegram);
}
