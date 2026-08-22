"use client";

import Link from "next/link";
import { useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { ShareButton } from "@/components/product/ShareButton";
import { siteConfig } from "@/lib/site-config";
import { useCart } from "@/components/cart/CartProvider";
import { startingPrice, type PublicProduct } from "@/lib/product-types";
import { formatMoney } from "@/lib/order-schema";

// Product card with add-to-basket built in, so a customer can fill a
// basket straight from the listing without opening every cake.
//
// The card is a link, but the button sits *outside* that link element
// rather than inside it — nesting a button in an anchor is invalid HTML
// and makes keyboard behaviour unpredictable.
export function ProductCard({
  product,
  priority = false,
  acceptingOrders = true,
}: {
  product: PublicProduct;
  priority?: boolean;
  /** When the shop is closed, the card still browses but can't be added. */
  acceptingOrders?: boolean;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  const from = startingPrice(product);
  const hasChoices = product.variants.length > 1;

  function handleAdd() {
    const first = product.variants[0];
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.imageUrl,
      variantLabel: first?.label ?? null,
      unitPrice: first?.price ?? product.price,
      quantity: 1,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)]">
      {/* The share control sits alongside the image link, not inside it —
          a button nested in an anchor is invalid and would trigger
          navigation as well as the share sheet. */}
      <div className="relative">
        <div className="absolute right-3 top-3 z-10">
          <ShareButton
            compact
            placement="down"
            url={`${siteConfig.url}/products/${product.slug}`}
            title={product.name}
            text={
              product.shortDescription
                ? `${product.name} — ${product.shortDescription}`
                : `${product.name} from ${siteConfig.name}`
            }
          />
        </div>
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-surface-soft"
      >
        <SafeImage
          src={product.imageUrl ?? "/images/cakes/placeholder.jpg"}
          alt={product.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          label="Add photo in Leo Billing"
        />
        {product.isFeatured && (
          <span className="absolute left-3 top-3 rounded-full bg-yellow px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink">
            Popular
          </span>
        )}
      </Link>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 min-h-[2.4em] font-display text-lg leading-tight text-ink transition-colors hover:text-accent">
            {product.name}
          </h3>
        </Link>

        {/* Always rendered, with a fixed two-line box. Cards stretch to
            the tallest in the row, but without this the description
            slot collapsed on products that have none, so their price
            and Add button sat at a different height to their
            neighbours'. */}
        <p className="mt-1.5 line-clamp-2 min-h-[2.6em] text-[13px] leading-relaxed text-muted">
          {product.shortDescription ?? ""}
        </p>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <p className="font-display text-xl text-accent">
            {hasChoices && (
              <span className="mr-1 font-sans text-[11px] font-normal text-muted">
                from
              </span>
            )}
            {formatMoney(from)}
          </p>

          <button
            type="button"
            onClick={handleAdd}
            disabled={!acceptingOrders}
            aria-label={
              acceptingOrders
                ? `Add ${product.name} to basket`
                : "We're not taking orders right now"
            }
            title={acceptingOrders ? undefined : "We're not taking orders right now"}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all ${
              !acceptingOrders
                ? "cursor-not-allowed bg-border text-muted"
                : added
                  ? "bg-success text-on-accent"
                  : "bg-ink text-on-accent hover:bg-accent"
            }`}
          >
            {added ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
