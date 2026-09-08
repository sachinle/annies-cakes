import type { Metadata } from "next";
import { Belanosima, Poppins } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileStickyBar } from "@/components/layout/MobileStickyBar";
import { NavProgress } from "@/components/layout/NavProgress";
import { GoogleTagManager } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CartProvider } from "@/components/cart/CartProvider";
import { getUser } from "@/lib/supabase/server-auth";
import { site } from "@/content/site";
import { siteConfig } from "@/lib/site-config";

// GTM container. Read from the environment so a fork or a staging
// deploy can point at a different container without a code change,
// with the live container as the default.
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-PVJBFG4B";

const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : null;
import "./globals.css";

const belanosima = Belanosima({
  variable: "--font-belanosima",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  fallback: ["ui-rounded", "Segoe UI", "system-ui", "sans-serif"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  fallback: ["system-ui", "Segoe UI", "Roboto", "sans-serif"],
});

// Static — no database call. Content lives in src/content/site.ts.
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: { default: site.seo.title, template: `%s — ${site.name}` },
  description: site.seo.description,
  // Root canonical. Child pages override it with their own path; without
  // this the site shipped no canonical at all, so Vercel preview URLs and
  // any parameterised variant competed with the real page.
  alternates: { canonical: "/" },
  applicationName: site.name,
  authors: [{ name: site.name, url: siteConfig.url }],
  creator: site.name,
  publisher: site.name,
  category: "Food & Drink",
  keywords: [
    "homemade cakes Coimbatore",
    "birthday cake Coimbatore",
    "bento cake Coimbatore",
    "custom cakes Coimbatore",
    "fresh cream cake",
    "brownies Coimbatore",
    "cake delivery Coimbatore",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { telephone: true, address: true, email: true },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.seo.title,
    description: site.seo.description,
    url: siteConfig.url,
    locale: "en_IN",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${site.name} — homemade cakes baked fresh to order in Coimbatore`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.seo.title,
    description: site.seo.description,
    images: ["/og-image.png"],
  },
};

// Applies the saved theme before first paint so a customer who chose
// dark mode never sees a flash of light.
// Runs before first paint. The `js` class is what lets scroll-reveal
// hide content — without it, every section renders visible, so a
// hydration hiccup can never leave the page blank.
const themeScript = `document.documentElement.classList.add('js');try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.dataset.theme='dark'}catch(e){}`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const signedIn = Boolean(await getUser());

  return (
    <html
      lang="en-IN"
      className={`${belanosima.variable} ${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* The first product photo is a Supabase URL, and the DNS +
            TLS handshake for it lands on the critical path for LCP.
            Opening the connection during head parsing removes it. */}
        {supabaseOrigin && (
          <>
            <link rel="preconnect" href={supabaseOrigin} crossOrigin="" />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        )}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      {/* Google Tag Manager. Next's component rather than the raw
          console snippet: it loads the container after hydration so
          it never blocks first paint, injects the <noscript> iframe
          itself, and keeps the inline script out of the React tree.
          The container ID is public by design - it identifies the
          container, it does not grant access to it. */}
      <GoogleTagManager gtmId={GTM_ID} />

      <body className="flex min-h-full flex-col bg-background pb-[7.5rem] text-ink md:pb-0">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-accent focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-on-accent"
        >
          Skip to content
        </a>
        <CartProvider signedIn={signedIn}>
          <NavProgress />
          <Header />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer />
          <MobileStickyBar />

          {/* Page views and Core Web Vitals from real visitors.
              Chosen over Google Analytics deliberately: no cookies, no
              cross-site identifiers and no consent banner needed under
              GDPR/DPDP, which matters for a shop whose customers are
                mostly on a phone.

              SpeedInsights also reports field LCP, which is the only
              reliable way to see what real devices experience — the lab
              run has been returning NO_LCP, and field data does not
              depend on that trace completing. */}
          <Analytics />
          <SpeedInsights />
        </CartProvider>
      </body>
    </html>
  );
}
