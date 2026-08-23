import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // Strip the framework banner. It tells an attacker what to target and
  // does nothing for anyone else.
  poweredByHeader: false,

  // Emit a trailing-slash-free canonical form and redirect the other,
  // so /products and /products/ never both exist as indexable URLs.
  trailingSlash: false,

  compress: true,

  images: {
    // Product photos live in Supabase Storage; only that host is allowed
    // through next/image's optimizer.
    remotePatterns: supabaseHostname
      ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/**" }]
      : [],
    // Modern formats first. AVIF is typically 20-30% smaller than WebP
    // on photography, which is what this whole site is.
    formats: ["image/avif", "image/webp"],
    // One product image per product, optimized on upload (see product
    // upload pipeline) — 75 is a good quality/size balance for cake
    // photography and is next/image's stable default in Next 16.
    qualities: [75],
    // Cache optimised derivatives for a year. The URL changes when the
    // source does, so a long TTL costs nothing and saves re-encoding.
    minimumCacheTTL: 31536000,
    // Next 16 blocks optimising images whose host resolves to a private
    // IP, as SSRF protection. On a NAT64 network (IPv6-only or DNS64),
    // Supabase's public Cloudflare address arrives as 64:ff9b::<v4>,
    // which that check reads as private — so local development can't
    // load any product photo.
    //
    // Enabled in development only. The real SSRF defence here is
    // `remotePatterns` above: the optimiser will only ever fetch from
    // this one Supabase host under /storage/v1/object/**, so a crafted
    // /_next/image?url=... cannot be pointed at an internal service
    // regardless of this flag. Production keeps the check on, where
    // DNS resolves normally and the guard costs nothing.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  },

  async headers() {
    // Security headers applied site-wide.
    //
    // No Content-Security-Policy here on purpose: Next injects inline
    // scripts for hydration and the theme flash-guard, so a correct CSP
    // needs per-request nonces through the proxy. A broken CSP silently
    // stops the site working, so it belongs in its own change with its
    // own testing rather than bundled into an SEO pass.
    const security = [
      // Stop the browser second-guessing declared MIME types, which is
      // how a text file gets executed as script.
      { key: "X-Content-Type-Options", value: "nosniff" },
      // The site is never meant to be framed; this blocks clickjacking.
      { key: "X-Frame-Options", value: "DENY" },
      // Send the origin to other sites, the full path only to ourselves,
      // so customer order URLs never leak in a referrer.
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      // Nothing here needs these; denying them removes the prompts
      // entirely. Geolocation is a deliberate exception — checkout uses
      // it for "use my location".
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), payment=(), usb=(), magnetometer=(), geolocation=(self)",
      },
      { key: "X-DNS-Prefetch-Control", value: "on" },
    ];

    return [
      { source: "/:path*", headers: security },
      // No custom Cache-Control for /_next/static here on purpose.
      //
      // Vercel already serves those with
      // `public,max-age=31536000,immutable` (Next 16 emits them under
      // /_next/static/immutable/), so a rule of our own added nothing —
      // and in `next dev` it was harmful: dev rebuilds chunks under the
      // same paths, so a year-long TTL made the browser serve stale
      // JavaScript and never pick up edits. Next warns about exactly
      // this on boot. Verified against the deployment: the header is
      // already correct without us.
      {
        source: "/:file(favicon.ico|logo.png|icon-192.png|apple-icon.png)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/:file(robots.txt|sitemap.xml|llms.txt|manifest.webmanifest)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
