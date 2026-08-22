import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

// robots.txt
//
// Everything public is crawlable. Only the signed-in area and the admin
// API are excluded: /account holds one customer's own orders and
// addresses, and /api/admin is owner-only — neither has any business in
// a search index, and crawling them wastes budget on pages that return
// a redirect or a 401 anyway.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/account/",
          "/api/",
          "/checkout",
          "/cart",
          "/signin",
          "/signup",
          "/forgot-password",
          "/auth/",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
