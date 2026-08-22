"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function CartBadge() {
  const { count, ready } = useCart();

  return (
    <Link
      href="/cart"
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-background hover:text-accent"
      aria-label={count > 0 ? `Basket, ${count} items` : "Basket"}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" strokeLinejoin="round" />
        <path d="M3 6h18M16 10a4 4 0 0 1-8 0" strokeLinecap="round" />
      </svg>
      {/* Hidden until the stored cart has loaded, so the count never
          flashes 0 and then jumps. */}
      {ready && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
