// Cart types and pure helpers — no server-only import, so both the
// cart provider (client) and the checkout action (server) can use them.

export type CartLine = {
  productId: number;
  slug: string;
  name: string;
  imageUrl: string | null;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
  colour?: string;
  cakeMessage?: string;
};

export const MAX_LINE_QUANTITY = 20;
export const MAX_CART_LINES = 15;

/** Same cake, same size = one line. Different size = its own line. */
export function lineKey(productId: number, variantLabel: string | null): string {
  return `${productId}::${variantLabel ?? ""}`;
}

export function cartTotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}
