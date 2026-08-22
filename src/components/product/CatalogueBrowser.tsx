"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductCard } from "./ProductCard";
import { startingPrice, type PublicProduct } from "@/lib/product-types";
import { formatMoney } from "@/lib/order-schema";

type SortKey = "featured" | "price-asc" | "price-desc" | "name";

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "featured", label: "Our picks" },
  { key: "price-asc", label: "Price: low to high" },
  { key: "price-desc", label: "Price: high to low" },
  { key: "name", label: "A-Z" },
];

// Catalogue with filters in a left-hand panel, the way a shopper
// expects from any store they already use.
//
// The previous stacked layout put the heading, search, sort, category
// chips and price slider all in the vertical flow, which on a phone
// filled the entire first screen — you had to scroll past every control
// before seeing a single cake. Filters now sit beside the grid on
// desktop and behind a button on mobile, so products are the first
// thing on screen either way.
//
// Filtering still happens in the browser over the already-loaded
// catalogue; with a few dozen cakes that is instant and needs no round
// trip. If it ever grows into the hundreds this should move server-side.
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
  const [drawerOpen, setDrawerOpen] = useState(false);

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
      // "chocolate" expecting it to match however we have filed it.
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

  const activeCount =
    (category ? 1 : 0) + (maxPrice !== null ? 1 : 0) + (query ? 1 : 0);

  // Stop the page scrolling behind the mobile drawer.
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  function clearAll() {
    setQuery("");
    setCategory(null);
    setMaxPrice(null);
  }

  const filters = (
    <FilterPanel
      categories={categories}
      category={category}
      setCategory={setCategory}
      priceCeiling={priceCeiling}
      maxPrice={maxPrice}
      setMaxPrice={setMaxPrice}
      activeCount={activeCount}
      onClear={clearAll}
    />
  );

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-10">
      {/* Desktop panel. Sticky so filters stay reachable while the grid
          scrolls, which is the whole point of moving them here. */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">{filters}</div>
      </aside>

      <div className="min-w-0">
        {/* Search + sort. On mobile the Filters button stands in for the
            panel; on desktop only search and sort live here. */}
        <div className="flex gap-2">
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
              placeholder="Search cakes..."
              aria-label="Search cakes"
              className="w-full rounded-full border border-border bg-surface py-3 pl-11 pr-4 text-ink outline-none placeholder:text-muted focus:border-accent"
            />
          </div>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-4 py-3 text-sm font-medium text-ink lg:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M3 6h18M6 12h12M10 18h4" strokeLinecap="round" />
            </svg>
            Filters
            {activeCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-on-accent">
                {activeCount}
              </span>
            )}
          </button>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort cakes"
            className="hidden shrink-0 rounded-full border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent lg:block"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-sm text-muted">
            {visible.length} {visible.length === 1 ? "cake" : "cakes"}
          </p>
          {activeCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="text-sm font-medium text-accent hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {visible.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
            <p className="font-display text-xl text-ink">Nothing matched that</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              Try a different search, or clear the filters to see everything we
              make.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
            {visible.map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                /* Only the first row. Anything lower is scrolled to,
                   and preloading it just delays what is on screen. */
                priority={i < 2}
                acceptingOrders={acceptingOrders}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-[26px] bg-background p-6 pb-8 shadow-[var(--shadow-lift)]"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-2xl text-ink">Filters</h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-lg text-ink"
                aria-label="Close filters"
              >
                &times;
              </button>
            </div>

            <label
              htmlFor="mobile-sort"
              className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted"
            >
              Sort
            </label>
            <select
              id="mobile-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="mb-6 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>

            {filters}

            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="mt-7 w-full rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-on-accent"
            >
              Show {visible.length} {visible.length === 1 ? "cake" : "cakes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterPanel({
  categories,
  category,
  setCategory,
  priceCeiling,
  maxPrice,
  setMaxPrice,
  activeCount,
  onClear,
}: {
  categories: string[];
  category: string | null;
  setCategory: (c: string | null) => void;
  priceCeiling: number;
  maxPrice: number | null;
  setMaxPrice: (p: number | null) => void;
  activeCount: number;
  onClear: () => void;
}) {
  return (
    <div>
      {categories.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Category
          </h3>
          <ul className="mt-3 space-y-1">
            <li>
              <FilterRow active={category === null} onClick={() => setCategory(null)}>
                All cakes
              </FilterRow>
            </li>
            {categories.map((c) => (
              <li key={c}>
                <FilterRow active={category === c} onClick={() => setCategory(c)}>
                  {c}
                </FilterRow>
              </li>
            ))}
          </ul>
        </section>
      )}

      {priceCeiling > 0 && (
        <section className="mt-7 border-t border-border pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Price
          </h3>
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
            aria-label="Maximum price"
            className="mt-4 h-1 w-full cursor-pointer accent-[var(--color-accent)]"
          />
          <p className="mt-2 text-sm font-medium text-ink">
            {maxPrice === null ? "Any price" : `Up to ${formatMoney(maxPrice)}`}
          </p>
        </section>
      )}

      {activeCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="mt-6 text-sm font-medium text-accent hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}

function FilterRow({
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
      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        active
          ? "bg-accent font-semibold text-on-accent"
          : "text-ink-soft hover:bg-surface hover:text-accent"
      }`}
    >
      {children}
    </button>
  );
}
