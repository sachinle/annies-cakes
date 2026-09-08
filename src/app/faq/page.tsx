import type { Metadata } from "next";
import Link from "next/link";
import { site, whatsappHref } from "@/content/site";
import { siteConfig } from "@/lib/site-config";
import { Reveal } from "@/components/Reveal";

// A real FAQ page, built from the same six answers the homepage shows.
//
// This was a PlaceholderPage saying "coming soon" while sitting in the
// sitemap — a page with no content that Google was being invited to
// crawl. Thin pages do not just fail to rank, they drag on the site
// that hosts them.
//
// Nothing here is invented. The questions and answers are the ones
// already in src/content/site.ts, which is also what the homepage and
// the FAQPage schema use, so all three can never disagree.

export const metadata: Metadata = {
  alternates: { canonical: "/faq" },
  title: "Cake Ordering FAQ — Delivery, Custom Designs & Lead Time",
  description:
    "How to order homemade cakes in Coimbatore: how much notice we need, custom designs, delivery areas, payment and collection. Answers from Annie's Homemade Cakes.",
  openGraph: {
    title: `Frequently Asked Questions — ${site.name}`,
    description:
      "Lead times, custom cake designs, delivery areas and payment, answered.",
    url: `${siteConfig.url}/faq`,
  },
};

export default function FaqPage() {
  // Same source as the homepage block, so the visible answers and the
  // structured data are guaranteed to match — which is the condition
  // for FAQ rich results being eligible at all.
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: site.faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="bg-blush">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-20">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Ordering
          </p>
          <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl lg:text-6xl">
            Questions, answered
          </h1>
          <p className="mt-5 leading-relaxed text-ink-soft">
            Everything people usually ask before ordering a homemade cake from
            us in {site.contact.city} — how much notice we need, what we can
            customise, where we deliver, and how payment works. If your question
            isn&apos;t here, message us and we&apos;ll answer it properly.
          </p>
        </Reveal>

        <div className="mt-10 space-y-3">
          {site.faq.items.map((item, i) => (
            <Reveal key={item.q} delay={i * 50}>
              <details
                className="group rounded-2xl border border-border bg-surface px-6 py-5"
                // The first answer is open so the page has visible content
                // above the fold rather than a stack of closed rows.
                open={i === 0}
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-medium text-ink">
                  <h2 className="text-base font-medium">{item.q}</h2>
                  <span
                    aria-hidden="true"
                    className="mt-0.5 shrink-0 text-xl leading-none text-accent transition-transform duration-300 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 pr-8 text-sm leading-relaxed text-ink-soft">
                  {item.a}
                </p>
              </details>
            </Reveal>
          ))}
        </div>

        <Reveal delay={100}>
          <div className="mt-12 rounded-[var(--radius-card)] border border-border bg-surface p-8 text-center">
            <h2 className="font-display text-2xl text-ink">
              Still not sure about something?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
              We&apos;d rather talk it through than have you guess. Message us
              with what you&apos;re planning and we&apos;ll tell you honestly
              what&apos;s possible.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href={whatsappHref("Hi! I have a question about ordering a cake.")}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
              >
                Ask on WhatsApp
              </a>
              <Link
                href="/products"
                className="rounded-full border-2 border-ink px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-on-accent"
              >
                Browse our cakes
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
