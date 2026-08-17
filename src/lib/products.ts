import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { ProductVariant, PublicProduct } from "@/lib/product-types";

// Public product catalogue.
//
// Reads run through the service-role client so we control exactly which
// columns leave the server. The `products` table is shared with Leo
// Billing and holds internal fields — stock, gst_rate, user_id — that a
// customer has no business seeing. Those are never in a select list
// here, so they cannot leak even by accident.
//
// A product is only public when the owner has explicitly published it
// AND it has a slug to live at. Nothing is published by default (see
// migration 0003) — the billing catalogue contains delivery charges,
// non-cake items, and test rows that must never reach the website.

const PUBLIC_COLUMNS =
  "id, slug, name, short_description, description, price, unit, image_url, website_category, is_featured, rating_avg, rating_count, variants";

// Types and pure helpers live in product-types.ts so Client Components
// can import them without pulling this server-only module along.
export type { ProductVariant, PublicProduct } from "@/lib/product-types";
export { startingPrice, formatPrice } from "@/lib/product-types";

type ProductRow = {
  id: number;
  slug: string | null;
  name: string;
  short_description: string | null;
  description: string | null;
  price: number | string | null;
  unit: string | null;
  image_url: string | null;
  website_category: string | null;
  is_featured: boolean | null;
  rating_avg: number | string | null;
  rating_count: number | null;
  variants: unknown;
};

/**
 * Variants come from a jsonb column the owner edits by hand, so the
 * shape isn't guaranteed. Anything malformed is dropped rather than
 * allowed to reach a page as "₹NaN".
 */
function toVariants(raw: unknown): ProductVariant[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => {
      if (typeof v !== "object" || v === null) return null;
      const { label, price } = v as { label?: unknown; price?: unknown };
      const parsedPrice = Number(price);
      if (typeof label !== "string" || !label.trim()) return null;
      if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) return null;
      return { label: label.trim(), price: parsedPrice };
    })
    .filter((v): v is ProductVariant => v !== null);
}

function toPublicProduct(row: ProductRow): PublicProduct {
  return {
    id: row.id,
    slug: row.slug as string,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    price: Number(row.price ?? 0),
    unit: row.unit ?? "kg",
    imageUrl: row.image_url,
    category: row.website_category,
    isFeatured: Boolean(row.is_featured),
    ratingAvg: Number(row.rating_avg ?? 0),
    ratingCount: row.rating_count ?? 0,
    variants: toVariants(row.variants),
  };
}


export async function getPublishedProducts(): Promise<PublicProduct[]> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .select(PUBLIC_COLUMNS)
    .eq("is_published", true)
    .not("slug", "is", null)
    .order("is_featured", { ascending: false })
    .order("name");

  if (error) throw new Error(`Failed to load products: ${error.message}`);
  return (data ?? []).map(toPublicProduct);
}

export async function getProductBySlug(
  slug: string
): Promise<PublicProduct | null> {
  const { data, error } = await getSupabaseAdmin()
    .from("products")
    .select(PUBLIC_COLUMNS)
    .eq("is_published", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Failed to load product: ${error.message}`);
  return data ? toPublicProduct(data) : null;
}

export async function getProductCategories(): Promise<string[]> {
  const products = await getPublishedProducts();
  const categories = new Set(
    products.map((p) => p.category).filter((c): c is string => Boolean(c))
  );
  return [...categories].sort();
}

