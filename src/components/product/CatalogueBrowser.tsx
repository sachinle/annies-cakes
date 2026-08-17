"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "./ProductCard";
import { startingPrice, type PublicProduct } from "@/lib/product-types";
import { formatMoney } from "@/lib/order-schema";

type SortKey = "featured" | "price-asc" | "price-desc" | "name";

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "featured", label: "Our picks" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "name", label: "A–Z" },
];

// Filtering happens in the browser over the already-loaded catalogue.
// With a few dozen cakes that's instant and needs no round trip; if the
// catalogue ever grows into the hundreds this should move server-side.
export function CatalogueBrowser({
  products,
  acceptingOrders = true,
}: {
  products: PublicProduct[];
  acceptingOrders?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("featured");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);

  const categories = useMemo(
    () =>
      [...new Set(products.map((p) => p.category).filter(Boolean))].sort() as string[],
    [products]
  );

  const priceCeiling = useMemo(
    () => Math.max(...products.map(startingPrice), 0),
    [products]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = products.filter((p) => {
      if (category && p.category !== category) return false;
      if (maxPrice !== null && startingPrice(p) > maxPrice) return false;
      if (!q) return true;
      // Search name, description, and category together — customers type
      // "chocolate" expecting it to match however we've filed it.
      return (
        p.name.toLowerCase().includes(q) ||
        (p.shortDescription ?? "").toLowerCase().includes(q) ||
        (p.category ?? "").toLowerCase().includes(q)
      );
    });

    const sorted = [...filtered];
    switch (sort) {
      case "price-asc":
        sorted.sort((a, b) => startingPrice(a) - startingPrice(b));
        break;
      case "price-desc":
        sorted.sort((a, b) => startingPrice(b) - startingPrice(a));
        break;
      case "name":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        sorted.sort(
          (a, b) => Number(b.isFeatured) - Number(a.isFeatured) ||
            a.name.localeCompare(b.name)
        );
    }
    return sorted;
  }, [products, query, category, maxPrice, sort]);

  const filtersActive = Boolean(query || category || maxPrice !== null);

  return (
    <>
      {/* Search */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            width="17" height="17" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.7" aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cakes, flavours, occasions…"
            aria-label="Search cakes"
            className="w-full rounded-full border border-border bg-surface py-3 pl-11 pr-4 text-ink outline-none placeholder:text-muted focus:border-accent"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sort cakes"
          className="rounded-full border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip active={category === null} onClick={() => setCategory(null)}>
            All cakes
          </Chip>
          {categories.map((c) => (
            <Chip key={c} active={category === c} onClick={() => setCategory(c)}>
              {c}
            </Chip>
          ))}
        </div>
      )}

      {/* Price */}
      {priceCeiling > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <label htmlFor="max-price" className="text-sm text-ink-soft">
            Up to
          </label>
          <input
            id="max-price"
            type="range"
            min={0}
            max={priceCeiling}
            step={50}
            value={maxPrice ?? priceCeiling}
            onChange={(e) => {
              const v = Number(e.target.value);
              setMaxPrice(v >= priceCeiling ? null : v);
            }}
            className="h-1 w-48 cursor-pointer accent-[var(--color-accent)]"
          />
          <span className="text-sm font-medium text-ink">
            {maxPrice === null ? "Any price" : formatMoney(maxPrice)}
          </span>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-4 border-t border-border pt-5">
        <p className="text-sm text-muted">
          {visible.length} {visible.length === 1 ? "cake" : "cakes"}
        </p>
        {filtersActive && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory(null);
              setMaxPrice(null);
            }}
            className="text-sm font-medium text-accent hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="font-display text-xl text-ink">Nothing matched that</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Try a different search, or clear the filters to see everything we
            make.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p, i) => (
            <ProductCard key={p.id} product={p} priority={i < 3} acceptingOrders={acceptingOrders} />
          ))}
        </div>
      )}
    </>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-accent bg-accent text-white"
          : "border-border bg-surface text-ink-soft hover:border-accent hover:text-accent"
      }`}
    >
      {children}
    </button>
  );
}
