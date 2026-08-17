import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";

// Whether the shop is currently taking orders, controlled from Leo
// Billing. Used to hide the order buttons and block submissions when
// the kitchen is closed.

export type StoreStatus = {
  acceptingOrders: boolean;
  message: string;
};

const DEFAULT_CLOSED_MESSAGE =
  "We're not taking new orders at the moment — the kitchen is full or we're away. Do message us on WhatsApp and we'll let you know when we're back.";

export async function getStoreStatus(): Promise<StoreStatus> {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("store_settings")
      .select("accepting_orders, offline_message")
      .eq("id", true)
      .maybeSingle();

    // Default to OPEN when the row is missing or unreadable. A database
    // hiccup silently closing the shop would cost real orders and would
    // be very hard to notice; the owner would have no idea why it went
    // quiet.
    if (error || !data) return { acceptingOrders: true, message: "" };

    return {
      acceptingOrders: data.accepting_orders !== false,
      message: data.offline_message?.trim() || DEFAULT_CLOSED_MESSAGE,
    };
  } catch {
    return { acceptingOrders: true, message: "" };
  }
}
