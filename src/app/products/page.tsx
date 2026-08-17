import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedProducts } from "@/lib/products";
import { getStoreStatus } from "@/lib/store-status";
import { StoreClosedNotice } from "@/components/StoreClosedNotice";
import { CatalogueBrowser } from "@/components/product/CatalogueBrowser";
import { whatsappHref } from "@/content/site";

export const metadata: Metadata = {
  title: "Our Products",
  description:
    "Browse our homemade cakes — fresh cream cakes, bento cakes, brownies and more, baked to order.",
};

export default async function ProductsPage() {
  const [products, store] = await Promise.all([
    getPublishedProducts(),
    getStoreStatus(),
  ]);

  return (
    <div className="bg-blush">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <header className="max-w-xl">
          <h1 className="font-display text-5xl text-ink sm:text-6xl">
            Our Products
          </h1>
          <p className="mt-5 leading-relaxed text-ink-soft">
            Every cake is baked after you order — nothing sits on a shelf.
            Sizes and decoration can be adjusted, so just ask if you don&apos;t
            see what you had in mind.
          </p>
        </header>

        {!store.acceptingOrders && (
          <div className="mt-10">
            <StoreClosedNotice message={store.message} />
          </div>
        )}

        {products.length === 0 ? (
          <EmptyState />
        ) : (
          <CatalogueBrowser
            products={products}
            acceptingOrders={store.acceptingOrders}
          />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-12 rounded-[var(--radius-card)] border-2 border-dashed border-border bg-surface p-12 text-center">
      <p className="font-display text-2xl text-ink">
        Our menu is being photographed
      </p>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted">
        Publish a few cakes in Leo Billing → Products and they&apos;ll appear
        here. In the meantime, tell us what you&apos;re planning.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a
          href={whatsappHref("Hi! I'd like to ask about ordering a cake.")}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent"
        >
          Ask on WhatsApp
        </a>
        <Link
          href="/contact"
          className="rounded-full border-2 border-ink px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}
