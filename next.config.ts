import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
    // Product photos live in Supabase Storage; only that host is allowed
    // through next/image's optimizer.
    remotePatterns: supabaseHostname
      ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/**" }]
      : [],
    // One product image per product, optimized on upload (see product
    // upload pipeline) — 75 is a good quality/size balance for cake
    // photography and is next/image's stable default in Next 16.
    qualities: [75],
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
};

export default nextConfig;
