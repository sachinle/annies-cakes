"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { formatMoney } from "@/lib/order-schema";
import type { PublicProduct } from "@/lib/product-types";

// Size picker + add to basket. Lives on the product page.
//
// Doesn't require sign-in: the basket works for guests via localStorage
// and merges into their account when they sign in at checkout. Asking
// someone to log in before they can even pick a cake loses orders.
export function AddToCartButton({ product }: { product: PublicProduct }) {
  const { add } = useCart();
  const hasVariants = product.variants.length > 0;

  const [variantLabel, setVariantLabel] = useState<string | null>(
    hasVariants ? product.variants[0].label : null
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const unitPrice = hasVariants
    ? (product.variants.find((v) => v.label === variantLabel)?.price ??
       product.variants[0].price)
    : product.price;

  function handleAdd() {
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.imageUrl,
      variantLabel,
      unitPrice,
      quantity,
    });
    setAdded(true);
    // Revert the label so the button is reusable without a page change.
    setTimeout(() => setAdded(false), 2200);
  }

  return (
    <div>
      {hasVariants && (
        <div className="mb-5">
          <p className="mb-2 text-sm font-medium text-ink">Choose a size</p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <button
                key={v.label}
                type="button"
                onClick={() => setVariantLabel(v.label)}
                aria-pressed={variantLabel === v.label}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  variantLabel === v.label
                    ? "border-accent bg-accent text-white"
                    : "border-border text-ink hover:border-accent"
                }`}
              >
                {v.label} · {formatMoney(v.price)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-full border border-border">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-l-full text-lg text-ink hover:text-accent"
            aria-label="Reduce quantity"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-medium text-ink" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(20, q + 1))}
            className="flex h-11 w-11 items-center justify-center rounded-r-full text-lg text-ink hover:text-accent"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className={`flex-1 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-all hover:shadow-[var(--shadow-lift)] ${
            added ? "bg-success" : "bg-accent hover:bg-accent-hover"
          }`}
        >
          {added ? "Added to basket ✓" : `Add to Basket · ${formatMoney(unitPrice * quantity)}`}
        </button>
      </div>
    </div>
  );
}
