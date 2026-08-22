"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendOrderStatusEmail } from "@/lib/notify";
import { sendMessage, allowedChatIds, esc } from "@/lib/telegram";

// Customer-initiated cancellation.
//
// Only allowed while nothing has been baked yet. Once the kitchen has
// started, ingredients are already spent and a cake made to order can't
// be sold to anyone else — so cancelling then has to be a conversation,
// not a button.
const CANCELLABLE = ["received", "confirmed"] as const;

export type CancelState = { error?: string; ok?: boolean };

export async function cancelMyOrder(
  _prev: CancelState,
  formData: FormData
): Promise<CancelState> {
  const orderId = String(formData.get("orderId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 300);

  if (!orderId) return { error: "Something went wrong. Please reload." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  // Read through the customer's own session. RLS means a guessed id
  // belonging to someone else simply returns nothing — ownership is
  // enforced by the database, not by a check we could forget here.
  const { data: order, error: readError } = await supabase
    .from("orders")
    .select("id, order_no, status, product_name, contact_name, contact_email")
    .eq("id", orderId)
    .maybeSingle();

  if (readError || !order) return { error: "We couldn't find that order." };

  if (order.status === "cancelled") return { ok: true };

  if (!CANCELLABLE.includes(order.status as (typeof CANCELLABLE)[number])) {
    return {
      error:
        "This order is already being prepared, so it can't be cancelled here. Please call or WhatsApp us and we'll sort it out.",
    };
  }

  // The write goes through the admin client, because customers have no
  // UPDATE policy on `orders` — deliberately, since a blanket update
  // right would let them edit prices, dates or anyone else's order.
  //
  // This is still safe: the read above ran under the customer's own
  // session, so RLS has already proven this order belongs to them. The
  // admin write only ever runs on an id that check returned.
  //
  // Scoping to the cancellable statuses matters too. If the owner
  // confirms and starts baking between that read and this write, the
  // update matches nothing rather than cancelling a cake in the oven.
  const admin = getSupabaseAdmin();

  const { data: updated, error: updateError } = await admin
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("customer_id", user.id)
    .in("status", CANCELLABLE as unknown as string[])
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("[cancelMyOrder]", updateError);
    return { error: "We couldn't cancel that just now. Please try again." };
  }

  if (!updated) {
    return {
      error:
        "We just started preparing this order. Please call or WhatsApp us and we'll sort it out.",
    };
  }

  // Timeline entry: customers have no insert policy on history either.
  await admin.from("order_status_history").insert([
    {
      order_id: orderId,
      status: "cancelled",
      note: reason ? `Cancelled by customer: ${reason}` : "Cancelled by customer",
    },
  ]);

  // Best-effort, in parallel. The cancellation is already saved.
  await Promise.allSettled([
    sendOrderStatusEmail({
      status: "cancelled",
      orderNo: order.order_no,
      productName: order.product_name,
      customerName: order.contact_name ?? "there",
      customerEmail: order.contact_email,
    }),
    ...allowedChatIds().map((chat) =>
      sendMessage(
        chat,
        [
          `❌ <b>Order cancelled by customer</b>`,
          ``,
          `<b>${esc(order.order_no)}</b> — ${esc(order.product_name)}`,
          `👤 ${esc(order.contact_name ?? "—")}`,
          reason ? `📝 ${esc(reason)}` : null,
        ]
          .filter((l) => l !== null)
          .join("\n")
      )
    ),
  ]);

  revalidatePath("/account/orders");
  revalidatePath(`/account/orders/${orderId}`);
  return { ok: true };
}
