import type { Metadata } from "next";
import { Belanosima, Poppins } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileStickyBar } from "@/components/layout/MobileStickyBar";
import { NavProgress } from "@/components/layout/NavProgress";
import { CartProvider } from "@/components/cart/CartProvider";
import { getUser } from "@/lib/supabase/server-auth";
import { site } from "@/content/site";
import "./globals.css";

const belanosima = Belanosima({
  variable: "--font-belanosima",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

// Static — no database call. Content lives in src/content/site.ts.
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: { default: site.seo.title, template: `%s — ${site.name}` },
  description: site.seo.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: site.seo.title,
    description: site.seo.description,
  },
  twitter: { card: "summary_large_image" },
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
      lang="en"
      className={`${belanosima.variable} ${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-background pb-16 text-ink md:pb-0">
        <CartProvider signedIn={signedIn}>
          <NavProgress />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <MobileStickyBar />
        </CartProvider>
      </body>
    </html>
  );
}
