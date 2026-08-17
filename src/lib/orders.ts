import "server-only";
import { createClient } from "@/lib/supabase/server-auth";

// Customer order history.
//
// Reads run through the customer's own session, so RLS guarantees they
// only ever see their own orders. There is deliberately no
// `.eq("customer_id", …)` here that could be forgotten — the database
// is the boundary, not this function.

export const ORDER_STATUSES = [
  "received",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number] | "cancelled";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Request received",
  confirmed: "Order confirmed",
  preparing: "Preparing",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  completed: "Completed",
  cancelled: "Cancelled",
};

export type CustomerOrder = {
  id: string;
  orderNo: string;
  productName: string;
  quantity: number;
  status: OrderStatus;
  fulfillmentType: "pickup" | "delivery";
  preferredDate: string | null;
  createdAt: string;
  variant: Record<string, unknown>;
  cakeMessage: string | null;
  /** Set once the owner has raised a bill — drives the "View bill" link. */
  hasInvoice: boolean;
};

type OrderRow = {
  id: string;
  order_no: string;
  product_name: string;
  quantity: number | null;
  status: string;
  fulfillment_type: string;
  preferred_date: string | null;
  created_at: string;
  variant: Record<string, unknown> | null;
  cake_message: string | null;
  invoice_id: number | null;
};

function toOrder(row: OrderRow): CustomerOrder {
  return {
    id: row.id,
    orderNo: row.order_no,
    productName: row.product_name,
    quantity: row.quantity ?? 1,
    status: row.status as OrderStatus,
    fulfillmentType: row.fulfillment_type === "delivery" ? "delivery" : "pickup",
    preferredDate: row.preferred_date,
    createdAt: row.created_at,
    variant: row.variant ?? {},
    cakeMessage: row.cake_message,
    hasInvoice: row.invoice_id !== null,
  };
}

// invoice_id is selected but never exposed as a number — the customer
// only needs to know whether a bill exists, not its internal id.
const ORDER_COLUMNS =
  "id, order_no, product_name, quantity, status, fulfillment_type, preferred_date, created_at, variant, cake_message, invoice_id";

export async function getMyOrders(): Promise<CustomerOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load orders: ${error.message}`);
  return (data ?? []).map(toOrder);
}

export async function getMyOrder(id: string): Promise<CustomerOrder | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not load order: ${error.message}`);
  return data ? toOrder(data) : null;
}
