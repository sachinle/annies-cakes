"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ProductCard } from "./ProductCard";
import type { PublicProduct } from "@/lib/product-types";

// Horizontal product carousel for the homepage.
//
// Scrolling is native CSS scroll-snap, so touch, trackpad, keyboard and
// scrollbar all work without any of it being reimplemented. The arrows
// simply nudge scrollLeft, and they disable themselves at each end
// rather than sitting there doing nothing.
export function ProductCarousel({
  products,
  acceptingOrders = true,
}: {
  products: PublicProduct[];
  acceptingOrders?: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  function nudge(direction: 1 | -1) {
    const el = trackRef.current;
    if (!el) return;
    // Roughly one card plus its gap, so a click lands cleanly.
    const step = Math.max(240, el.clientWidth * 0.32);
    el.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-2 sm:gap-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product, i) => (
          <div
            key={product.id}
            className="w-[calc(50%-8px)] shrink-0 snap-start sm:w-[calc(40%-12px)] lg:w-[calc(25%-18px)]"
          >
            <ProductCard
              product={product}
              priority={i < 4}
              acceptingOrders={acceptingOrders}
            />
          </div>
        ))}
      </div>

      {/* Arrows are supplementary — the track scrolls fine without
          them, so they're hidden from assistive tech rather than
          duplicating the scroll region. */}
      <div className="mt-6 flex justify-end gap-2">
        <ArrowButton
          direction="left"
          disabled={atStart}
          onClick={() => nudge(-1)}
        />
        <ArrowButton
          direction="right"
          disabled={atEnd}
          onClick={() => nudge(1)}
        />
      </div>
    </div>
  );
}

function ArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "Scroll left" : "Scroll right"}
      className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-ink text-ink transition-all hover:bg-ink hover:text-white disabled:cursor-default disabled:border-border disabled:text-muted disabled:hover:bg-transparent disabled:hover:text-muted"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path
          d={direction === "left" ? "M15 18l-6-6 6-6" : "M9 18l6-6-6-6"}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
