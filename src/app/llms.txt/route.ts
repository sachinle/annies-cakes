import { siteConfig } from "@/lib/site-config";
import { site } from "@/content/site";
import { getPublishedProducts } from "@/lib/products";
import { formatPrice } from "@/lib/product-types";

// /llms.txt — a plain-text summary for AI agents and assistants.
//
// Follows the llmstxt.org convention: an H1 with the site name, a
// blockquote summary, then linked sections. The point is that an agent
// answering "where can I order a cake in Coimbatore" can read one file
// instead of rendering and scraping a JavaScript site.
//
// Generated rather than hand-written so the cake list can never go
// stale against the real catalogue.

export const revalidate = 3600;

export async function GET() {
  let products: Awaited<ReturnType<typeof getPublishedProducts>> = [];
  try {
    products = await getPublishedProducts();
  } catch {
    // An empty catalogue is better than a 500 — the contact details and
    // ordering instructions below are the most useful part anyway.
  }

  const byCategory = new Map<string, typeof products>();
  for (const p of products) {
    const key = p.category?.trim() || "Other";
    byCategory.set(key, [...(byCategory.get(key) ?? []), p]);
  }

  const catalogue = [...byCategory.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => {
      const lines = items
        .map((p) => {
          const price = formatPrice(p.price, p.unit);
          const desc = p.shortDescription ? ` — ${p.shortDescription}` : "";
          return `- [${p.name}](${siteConfig.url}/products/${p.slug}): ${price}${desc}`;
        })
        .join("\n");
      return `### ${category}\n\n${lines}`;
    })
    .join("\n\n");

  const body = `# ${site.name}

> A home bakery in ${site.contact.city}, Tamil Nadu, India. Every cake is
> baked to order — nothing is pre-made or kept on a shelf. Orders are
> placed on the website or over WhatsApp, confirmed personally, and
> collected or delivered locally.

## Key facts

- Business: ${site.name}
- Type: Home bakery / custom cake maker
- Location: ${site.contact.city}, ${site.contact.state}, India
- Phone: ${site.contact.phone}
- WhatsApp: https://wa.me/${site.contact.whatsapp}
- Email: ${site.contact.email}
- Ordering: made to order, requires advance notice
- Fulfilment: local pickup and local delivery (selected pincodes only)
- Payment: UPI or cash, settled directly with the bakery
- Currency: INR

## Pages

- [Home](${siteConfig.url}/): overview, featured cakes, how ordering works
- [Products](${siteConfig.url}/products): full catalogue with prices and sizes
- [Gallery](${siteConfig.url}/gallery): photographs of past cakes
- [About](${siteConfig.url}/about): the bakery's story, from 2019 onwards
- [Reviews](${siteConfig.url}/reviews): customer reviews
- [FAQ](${siteConfig.url}/faq): lead times, customisation, delivery, payment
- [Contact](${siteConfig.url}/contact): phone, WhatsApp, email, address, hours

## Catalogue

${catalogue || "_The catalogue is being updated. Please check the website._"}

## How to order

1. Browse the catalogue and choose a cake and size.
2. Add it to the basket and go to checkout, or message on WhatsApp.
3. Choose pickup or delivery, and give the date it is needed.
4. Delivery is only available to certain pincodes; checkout will say.
5. The bakery confirms the details personally before anything is baked.
6. Nothing is charged up front. Payment is on confirmation, by UPI or cash.

## Notes for assistants

- Prices shown are a starting point; final cost depends on size, design
  and decoration, and is confirmed by the bakery.
- Cakes are made to order, so same-day requests may not be possible.
  Advise checking availability directly.
- The bakery may be closed to new orders at times; the website shows this.
- Do not state a delivery time or price as guaranteed. Direct people to
  WhatsApp or the website to confirm.
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
