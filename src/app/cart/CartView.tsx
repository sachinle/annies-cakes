"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatMoney } from "@/lib/order-schema";

export function CartView() {
  const { lines, total, ready, setQuantity, remove } = useCart();

  if (!ready) {
    return (
      <div className="mt-10 space-y-4" aria-busy="true">
        {[0, 1].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-surface" />
        ))}
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
        <p className="font-display text-xl text-ink">Your basket is empty</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Once you&apos;ve picked a cake or two, they&apos;ll appear here.
        </p>
        <Link
          href="/products"
          className="mt-7 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
        >
          Browse our cakes
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
      <ul className="space-y-4">
        {lines.map((line) => (
          <li
            key={`${line.productId}-${line.variantLabel ?? ""}`}
            className="flex gap-4 rounded-xl border border-border bg-surface p-4"
          >
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-background">
              {line.imageUrl ? (
                <Image
                  src={line.imageUrl}
                  alt={line.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[10px] text-muted">
                  No photo
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
              <Link
                href={`/products/${line.slug}`}
                className="font-display text-lg font-semibold text-ink hover:text-accent"
              >
                {line.name}
              </Link>
              {line.variantLabel && (
                <p className="mt-0.5 text-sm text-muted">{line.variantLabel}</p>
              )}
              <p className="mt-1 text-sm text-accent">
                {formatMoney(line.unitPrice)} each
              </p>

              <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
                <div className="flex items-center rounded-full border border-border">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(line.productId, line.variantLabel, line.quantity - 1)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-l-full text-ink hover:text-accent"
                    aria-label={`Reduce quantity of ${line.name}`}
                  >
                    −
                  </button>
                  <span className="w-7 text-center text-sm font-medium text-ink">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(line.productId, line.variantLabel, line.quantity + 1)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-r-full text-ink hover:text-accent"
                    aria-label={`Increase quantity of ${line.name}`}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => remove(line.productId, line.variantLabel)}
                  className="text-sm text-muted hover:text-error"
                >
                  Remove
                </button>
              </div>
            </div>

            <p className="shrink-0 font-semibold text-ink">
              {formatMoney(line.unitPrice * line.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-xl border border-border bg-surface p-6 lg:sticky lg:top-24">
        <h2 className="text-base font-semibold text-ink">Summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-muted">
            <dt>Cakes</dt>
            <dd>{formatMoney(total)}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Delivery</dt>
            <dd>Confirmed with you</dd>
          </div>
        </dl>
        <div className="mt-4 flex justify-between border-t border-border pt-4 text-base font-semibold text-ink">
          <span>Estimated total</span>
          <span>{formatMoney(total)}</span>
        </div>

        <Link
          href="/checkout"
          className="mt-6 flex w-full items-center justify-center rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-on-accent shadow-[var(--shadow-soft)] transition-all hover:bg-accent-hover hover:shadow-[var(--shadow-lift)]"
        >
          Continue to Order
        </Link>

        <p className="mt-3 text-center text-xs text-muted">
          Nothing is charged now. We confirm every detail with you first.
        </p>
      </aside>
    </div>
  );
}
