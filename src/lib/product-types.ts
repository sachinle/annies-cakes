// Product types and pure helpers.
//
// Deliberately free of any server-only import so Client Components
// (the catalogue browser, product cards) can use these without dragging
// the service-role Supabase client into the browser bundle. The data
// fetching itself lives in products.ts, which IS server-only.

/** A size the customer can choose, with the real price they pay for it. */
export type ProductVariant = { label: string; price: number };

export type PublicProduct = {
  id: number;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  price: number;
  unit: string;
  imageUrl: string | null;
  category: string | null;
  isFeatured: boolean;
  ratingAvg: number;
  ratingCount: number;
  variants: ProductVariant[];
};

/** Cheapest price a customer could pay — used for "from ₹X". */
export function startingPrice(product: PublicProduct): number {
  if (product.variants.length === 0) return product.price;
  return Math.min(...product.variants.map((v) => v.price));
}

export function formatPrice(price: number, unit: string): string {
  const amount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
  return `${amount} / ${unit}`;
}
