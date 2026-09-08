import type { Metadata } from "next";
import Link from "next/link";
import { ProductImage } from "@/components/product/ProductImage";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { StoreClosedNotice } from "@/components/StoreClosedNotice";
import { ShareButton } from "@/components/product/ShareButton";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { getStoreStatus } from "@/lib/store-status";
import { notFound } from "next/navigation";
import {
  formatPrice,
  getProductBySlug,
  getPublishedProducts,
  getRelatedProducts,
  startingPrice,
} from "@/lib/products";
import { formatMoney } from "@/lib/order-schema";
import { siteConfig, whatsappLink } from "@/lib/site-config";

export async function generateStaticParams() {
  const products = await getPublishedProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/products/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const product = await getProductBySlug(slug);

  if (!product) return { title: "Cake not found" };

  const description =
    product.shortDescription ??
    `${product.name} — homemade, baked fresh to order.`;

  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description,
      images: product.imageUrl ? [product.imageUrl] : undefined,
    },
  };
}

export default async function ProductPage(props: PageProps<"/products/[slug]">) {
  const { slug } = await props.params;
  const [product, store] = await Promise.all([
    getProductBySlug(slug),
    getStoreStatus(),
  ]);

  if (!product) notFound();

  // Keeps someone browsing when this particular cake isn't the one.
  const related = await getRelatedProducts(product.slug, product.category, 4);

  const shareUrl = `${siteConfig.url}/products/${product.slug}`;
  const shareText = product.shortDescription
    ? `${product.name} — ${product.shortDescription}`
    : `${product.name} from ${siteConfig.name}`;

  const enquiry = whatsappLink(
    `Hi! I'd like to order the ${product.name}. Could you help me with the details?`
  );

  // Product schema for search results. Only emits a rating when real
  // reviews exist — never fabricate aggregateRating.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription ?? product.description ?? undefined,
    image: product.imageUrl ?? undefined,
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      url: `${siteConfig.url}/products/${product.slug}`,
    },
    ...(product.ratingCount > 0 && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.ratingAvg,
        reviewCount: product.ratingCount,
      },
    }),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "Cakes",
        item: `${siteConfig.url}/products`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${siteConfig.url}/products/${product.slug}`,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumbs. Google renders these in place of the raw URL in
          results, which reads far better than a slug — and it already
          matches the visible breadcrumb nav below, which is the
          condition for it being eligible. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/" className="hover:text-accent">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-accent">
          Cakes
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-soft">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <ProductImage src={product.imageUrl} alt={product.name} />

        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">{product.name}</h1>

          {product.ratingCount > 0 && (
            <p className="mt-2 text-sm text-muted">
              {product.ratingAvg.toFixed(1)} ★ from {product.ratingCount}{" "}
              {product.ratingCount === 1 ? "review" : "reviews"}
            </p>
          )}

          {product.variants.length > 0 ? (
            <div className="mt-4">
              <p className="text-2xl font-semibold text-accent">
                From {formatMoney(startingPrice(product))}
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <li
                    key={v.label}
                    className="rounded-full border border-border px-3.5 py-1.5 text-sm text-ink-soft"
                  >
                    {v.label} · {formatMoney(v.price)}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-2xl font-semibold text-accent">
              {formatPrice(product.price, product.unit)}
            </p>
          )}

          {product.shortDescription && (
            <p className="mt-4 text-ink-soft">{product.shortDescription}</p>
          )}

          {product.description && (
            <div className="mt-6 border-t border-border pt-6">
              <h2 className="text-base font-semibold text-ink">Details</h2>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {product.description}
              </p>
            </div>
          )}

          <div className="mt-8 border-t border-border pt-8">
            {store.acceptingOrders ? (
              <AddToCartButton product={product} />
            ) : (
              <StoreClosedNotice message={store.message} />
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {store.acceptingOrders && (
            <Link
              href={`/products/${product.slug}/order`}
              className="inline-flex items-center rounded-full border border-accent px-6 py-3 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-on-accent"
            >
              Order just this one
            </Link>
            )}
            {/* Secondary path for anything the form can't capture —
                custom designs, unusual sizes, "can you do this photo". */}
            <a
              href={enquiry}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
            >
              Ask about customisation
            </a>

            {/* Sharing stays available even when the kitchen is closed —
                a friend can still be shown the cake and order later. */}
            <ShareButton
              url={shareUrl}
              title={product.name}
              text={shareText}
            />
          </div>

          <p className="mt-6 text-xs text-muted">
            Cakes are made to order — please allow time when booking. Sizes and
            flavours can be customised.
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16 border-t border-border pt-12 sm:mt-20">
          <h2 className="font-display text-3xl text-ink sm:text-4xl">
            You might also like
          </h2>
          <div className="mt-8">
            <ProductCarousel products={related} acceptingOrders={store.acceptingOrders} />
          </div>
        </section>
      )}
    </div>
  );
}
