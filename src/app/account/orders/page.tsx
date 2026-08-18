import type { Metadata } from "next";
import Link from "next/link";
import { getMyOrders, STATUS_LABELS } from "@/lib/orders";
import { OrderTimeline } from "@/components/order/OrderTimeline";
import { ClearCartOnPlaced } from "@/components/cart/ClearCartOnPlaced";

export const metadata: Metadata = {
  title: "My Orders",
  robots: { index: false },
};

export default async function OrdersPage(props: PageProps<"/account/orders">) {
  const { placed, from } = await props.searchParams;
  const justPlaced = typeof placed === "string" ? placed : null;
  const fromCart = from === "cart";
  const orders = await getMyOrders();

  if (orders.length === 0 && !justPlaced) {
    return (
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">My orders</h1>
        <div className="mt-8 rounded-xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="font-display text-lg text-ink">No orders yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            When you order a cake, you&apos;ll be able to follow its progress
            here.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Browse cakes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {justPlaced && fromCart && <ClearCartOnPlaced orderNo={justPlaced} />}

      <h1 className="text-2xl font-semibold sm:text-3xl">My orders</h1>

      {justPlaced && (
        <div
          role="status"
          className="mt-6 rounded-xl border border-success/30 bg-success/10 p-5"
        >
          <p className="font-display text-lg font-semibold text-ink">
            Thank you — we&apos;ve got your request
          </p>
          <p className="mt-1.5 text-sm text-ink-soft">
            Your order is <strong>{justPlaced}</strong>. We&apos;ll call or
            message you shortly to confirm the details. Nothing is charged
            until we&apos;ve both agreed on everything.
          </p>
        </div>
      )}

      <ul className="mt-8 space-y-5">
        {orders.map((order) => (
          <li
            key={order.id}
            className="rounded-xl border border-border bg-surface p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="font-display text-lg font-semibold text-ink hover:text-accent"
                >
                  {order.productName}
                </Link>
                <p className="mt-0.5 text-sm text-muted">
                  Order {order.orderNo}
                  {order.quantity > 1 && ` · ${order.quantity} pcs`}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  order.status === "cancelled"
                    ? "bg-error/10 text-error"
                    : order.status === "completed"
                      ? "bg-success/10 text-success"
                      : "bg-accent/10 text-accent"
                }`}
              >
                {STATUS_LABELS[order.status]}
              </span>
            </div>

            {order.status !== "cancelled" && (
              <div className="mt-5">
                <OrderTimeline status={order.status} />
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-4">
              <Link
                href={`/account/orders/${order.id}`}
                className="rounded-full border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
              >
                Order details
              </Link>
              {order.hasInvoice && (
                <Link
                  href={`/account/orders/${order.id}`}
                  className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
                >
                  View bill
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
