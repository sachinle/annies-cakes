import type { MetadataRoute } from "next";
import { site } from "@/content/site";

// Web app manifest. Makes the site installable and gives Android a
// proper icon and splash colour instead of a screenshot of the page.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: "Annie's Cakes",
    description: site.seo.description,
    start_url: "/",
    display: "standalone",
    background_color: "#fff0f3",
    theme_color: "#e05c78",
    orientation: "portrait",
    categories: ["food", "shopping", "lifestyle"],
    lang: "en-IN",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
