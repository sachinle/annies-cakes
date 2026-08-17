"use server";

import { createClient } from "@/lib/supabase/server-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  MAX_CART_LINES,
  MAX_LINE_QUANTITY,
  lineKey,
  type CartLine,
} from "@/lib/cart-types";

// Server-side cart persistence.
//
// The browser keeps a copy in localStorage so the basket works instantly
// and survives a refresh even when signed out. Once signed in, these
// actions mirror it into `cart_items` so the basket follows the customer
// between devices.
//
// Prices are never accepted from the browser: whatever the client sends,
// the price is re-read from the product row here. A tampered
// localStorage cart therefore cannot change what anything costs.

/** Load the signed-in customer's saved cart, priced from the database. */
export async function loadServerCart(): Promise<CartLine[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("cart_items")
    .select("product_id, variant_label, quantity, colour, cake_message");

  if (error || !data || data.length === 0) return [];

  return priceLines(
    data.map((r) => ({
      productId: r.product_id,
      variantLabel: r.variant_label,
      quantity: r.quantity,
      colour: r.colour ?? undefined,
      cakeMessage: r.cake_message ?? undefined,
    }))
  );
}

/**
 * Replace the saved cart with these lines.
 * Called after any change, and once on sign-in to merge a guest basket.
 */
export async function saveServerCart(lines: CartLine[]): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return; // guests keep their cart in the browser only

  const trimmed = lines.slice(0, MAX_CART_LINES);

  // Replace wholesale — simpler and more predictable than diffing, and
  // the cart is at most a handful of rows.
  await supabase.from("cart_items").delete().eq("customer_id", user.id);

  if (trimmed.length === 0) return;

  await supabase.from("cart_items").insert(
    trimmed.map((l) => ({
      customer_id: user.id,
      product_id: l.productId,
      variant_label: l.variantLabel,
      quantity: Math.min(MAX_LINE_QUANTITY, Math.max(1, l.quantity)),
      colour: l.colour ?? null,
      cake_message: l.cakeMessage ?? null,
    }))
  );
}

/**
 * Re-price a set of lines from the database and drop anything that is no
 * longer on sale. Used on load and at checkout, so a cart that has been
 * sitting open for a week can't order an unpublished cake at a stale
 * price.
 */
export async function priceLines(
  raw: Array<{
    productId: number;
    variantLabel: string | null;
    quantity: number;
    colour?: string;
    cakeMessage?: string;
  }>
): Promise<CartLine[]> {
  if (raw.length === 0) return [];

  const ids = [...new Set(raw.map((r) => r.productId))];

  const { data: products } = await getSupabaseAdmin()
    .from("products")
    .select("id, slug, name, price, image_url, variants")
    .eq("is_published", true)
    .in("id", ids);

  if (!products) return [];

  const byId = new Map(products.map((p) => [p.id, p]));
  const seen = new Set<string>();
  const lines: CartLine[] = [];

  for (const r of raw) {
    const product = byId.get(r.productId);
    if (!product) continue; // unpublished or deleted — silently dropped

    const key = lineKey(r.productId, r.variantLabel);
    if (seen.has(key)) continue;
    seen.add(key);

    const variants = Array.isArray(product.variants) ? product.variants : [];
    const match = variants.find(
      (v: { label?: string }) => v?.label === r.variantLabel
    ) as { label: string; price: number } | undefined;

    lines.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      imageUrl: product.image_url,
      variantLabel: match?.label ?? null,
      unitPrice: Number(match?.price ?? product.price ?? 0),
      quantity: Math.min(MAX_LINE_QUANTITY, Math.max(1, r.quantity)),
      colour: r.colour,
      cakeMessage: r.cakeMessage,
    });
  }

  return lines.slice(0, MAX_CART_LINES);
}
