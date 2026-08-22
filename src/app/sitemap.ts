import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";
import { getPublishedProducts } from "@/lib/products";

// Sitemap covering static pages and every published cake.
//
// Product pages were missing entirely, which meant the only URLs Google
// was told about were the seven top-level pages — the catalogue, the
// part of the site actually worth ranking, had to be discovered by
// crawling. They are listed explicitly now.
//
// Signed-in pages (/account, /cart, /checkout, auth) are deliberately
// absent and are disallowed in robots.txt too: they are personal or
// transactional and have nothing to offer a search result.

// changeFrequency is a hint, not a promise. These reflect how the site
// actually behaves: the catalogue moves when cakes are published, the
// story pages almost never do.
const STATIC_ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/products", priority: 0.9, changeFrequency: "weekly" },
  { path: "/gallery", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about", priority: 0.7, changeFrequency: "yearly" },
  { path: "/reviews", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.5, changeFrequency: "yearly" },
  { path: "/contact", priority: 0.8, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${siteConfig.url}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // A sitemap that throws takes the whole route down and Google sees a
  // 500, which is worse than a sitemap listing only the static pages.
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await getPublishedProducts();
    productEntries = products.map((p) => ({
      url: `${siteConfig.url}/products/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      // Featured cakes are the ones the owner is actively pushing.
      priority: p.isFeatured ? 0.8 : 0.7,
    }));
  } catch (error) {
    console.error("[sitemap] product fetch failed:", error);
  }

  return [...staticEntries, ...productEntries];
}
