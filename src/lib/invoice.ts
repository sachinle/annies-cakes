import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server-auth";

// The customer's own bill, once the owner has created it in Leo Billing.
//
// Invoices live in Leo Billing's tables, whose RLS is owner-scoped, so
// this reads with the service role. That makes the ownership check here
// the only thing standing between one customer and another's bill —
// so it is done explicitly and first: we confirm the order belongs to
// the signed-in customer BEFORE fetching anything about the invoice.

export type CustomerInvoiceItem = {
  name: string;
  quantity: number;
  unit: string;
  price: number;
  total: number;
};

export type CustomerInvoice = {
  invoiceNo: string;
  date: string;
  subtotal: number;
  discountTotal: number;
  finalAmount: number;
  amountDue: number;
  paymentStatus: string;
  items: CustomerInvoiceItem[];
};

export async function getInvoiceForOrder(
  orderId: string
): Promise<CustomerInvoice | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Ownership check, through the customer's own session so RLS applies.
  // If this order isn't theirs, they get nothing.
  const { data: order } = await supabase
    .from("orders")
    .select("id, invoice_id")
    .eq("id", orderId)
    .maybeSingle();

  if (!order?.invoice_id) return null;

  const db = getSupabaseAdmin();

  const { data: invoice, error } = await db
    .from("invoices")
    .select(
      "invoice_no, date, subtotal, discount_total, final_amount, amount_due, payment_status"
    )
    .eq("id", order.invoice_id)
    .maybeSingle();

  if (error || !invoice) return null;

  const { data: items } = await db
    .from("invoice_items")
    .select("product_name, quantity, unit, price, total")
    .eq("invoice_id", order.invoice_id)
    .order("id");

  return {
    invoiceNo: invoice.invoice_no,
    date: invoice.date,
    subtotal: Number(invoice.subtotal ?? 0),
    discountTotal: Number(invoice.discount_total ?? 0),
    finalAmount: Number(invoice.final_amount ?? 0),
    amountDue: Number(invoice.amount_due ?? 0),
    paymentStatus: invoice.payment_status ?? "unpaid",
    items: (items ?? []).map((i) => ({
      name: i.product_name,
      quantity: Number(i.quantity ?? 1),
      unit: i.unit ?? "piece",
      price: Number(i.price ?? 0),
      total: Number(i.total ?? 0),
    })),
  };
}
