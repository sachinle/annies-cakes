import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMyOrder, STATUS_LABELS } from "@/lib/orders";
import { getInvoiceForOrder } from "@/lib/invoice";
import { OrderTimeline } from "@/components/order/OrderTimeline";
import { formatMoney } from "@/lib/order-schema";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false },
};

export default async function OrderDetailPage(
  props: PageProps<"/account/orders/[id]">
) {
  const { id } = await props.params;

  // getMyOrder runs under the customer's session, so RLS already
  // guarantees this is their own order — a guessed id returns nothing.
  const order = await getMyOrder(id);
  if (!order) notFound();

  const invoice = await getInvoiceForOrder(id);

  return (
    <div>
      <Link href="/account/orders" className="text-sm text-muted hover:text-accent">
        ← All orders
      </Link>

      <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">
        {order.productName}
      </h1>
      <p className="mt-1 text-sm text-muted">
        Order {order.orderNo}
        {order.quantity > 1 && ` · ${order.quantity} pieces`}
      </p>

      {order.status !== "cancelled" ? (
        <div className="mt-8 rounded-xl border border-border bg-surface p-5">
          <OrderTimeline status={order.status} />
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          This order was cancelled. Get in touch if that&apos;s unexpected.
        </p>
      )}

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <Detail label="Status" value={STATUS_LABELS[order.status]} />
        {order.preferredDate && (
          <Detail
            label="Needed by"
            value={new Date(order.preferredDate).toLocaleDateString("en-IN", {
              day: "numeric", month: "long", year: "numeric",
            })}
          />
        )}
        <Detail
          label="Collection"
          value={order.fulfillmentType === "delivery" ? "Delivery" : "Pickup"}
        />
        {order.cakeMessage && (
          <Detail label="Message on cake" value={`“${order.cakeMessage}”`} />
        )}
      </dl>

      {/* The bill appears only once the owner has created it in Leo Billing. */}
      {invoice ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-ink">Your bill</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-5 py-4">
              <span className="font-medium text-ink">{invoice.invoiceNo}</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  invoice.paymentStatus === "paid"
                    ? "bg-success/10 text-success"
                    : "bg-warning/10 text-warning"
                }`}
              >
                {invoice.paymentStatus === "paid" ? "Paid" : "Payment due"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-medium">Item</th>
                    <th className="px-5 py-3 text-right font-medium">Qty</th>
                    <th className="px-5 py-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, i) => (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 text-ink">{item.name}</td>
                      <td className="px-5 py-3 text-right text-muted">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-5 py-3 text-right text-ink">
                        {formatMoney(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1.5 border-t border-border px-5 py-4 text-sm">
              {invoice.discountTotal > 0 && (
                <Row label="Discount" value={`− ${formatMoney(invoice.discountTotal)}`} />
              )}
              <div className="flex justify-between pt-1 text-base font-semibold text-ink">
                <span>Total</span>
                <span>{formatMoney(invoice.finalAmount)}</span>
              </div>
              {invoice.amountDue > 0 && (
                <Row label="Still to pay" value={formatMoney(invoice.amountDue)} />
              )}
            </div>
          </div>
        </section>
      ) : (
        <p className="mt-10 rounded-lg border border-dashed border-border bg-surface px-5 py-4 text-sm text-muted">
          Your bill will appear here once we&apos;ve confirmed the details with
          you.
        </p>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
