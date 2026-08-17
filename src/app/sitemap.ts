import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

// Static routes only for now. Once the product catalogue exists (Phase 4),
// this will fetch published product slugs from Supabase and append them.
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/products", "/gallery", "/about", "/reviews", "/faq", "/contact"];

  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date(),
  }));
}
