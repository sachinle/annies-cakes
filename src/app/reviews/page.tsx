import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { siteConfig } from "@/lib/site-config";
import { Reveal } from "@/components/Reveal";

// A real reviews page, built from the Google reviews already on file.
//
// This was a PlaceholderPage in the sitemap — an empty page Google was
// being invited to crawl. It now carries every review verbatim, which
// is both the honest version and, incidentally, a page of genuine
// customer language about cakes in Coimbatore.
//
// No AggregateRating schema here, deliberately. Google requires that
// aggregate ratings come from reviews collected by the site itself, not
// republished from another platform — marking these up would be a
// structured-data violation. The reviews are shown as content and
// credited to Google, with a link to the source so anyone can check.

export const metadata: Metadata = {
  alternates: { canonical: "/reviews" },
  title: "Customer Reviews — Homemade Cakes in Coimbatore",
  description: `Read what ${site.testimonials.items.length}+ customers say about Annie's Homemade Cakes in Coimbatore — birthday cakes, bento cakes, brownies and custom designs, in their own words.`,
  openGraph: {
    title: `Customer Reviews — ${site.name}`,
    description: "Real reviews from customers who ordered from us.",
    url: `${siteConfig.url}/reviews`,
  },
};

const STAR_FILL = "#f5a623";
const STAR_EDGE = "#a8721f";
const STAR_EMPTY = "#e8e0d6";

export default function ReviewsPage() {
  const reviews = site.testimonials.items;
  const fiveStar = reviews.filter((r) => r.rating === 5).length;

  return (
    <div className="bg-blush">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            In their words
          </p>
          <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl lg:text-6xl">
            What our customers say
          </h1>
          <p className="mt-5 max-w-2xl leading-relaxed text-ink-soft">
            {reviews.length} reviews left on Google by people who ordered
            homemade cakes from us in {site.contact.city} — {fiveStar} of them
            five stars. Nothing here is edited or written by us; every word is
            the customer&apos;s own, and you can read them at the source.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, i) => (
            <Reveal key={`${review.name}-${i}`} delay={Math.min(i * 30, 300)}>
              <article className="flex h-full flex-col rounded-[var(--radius-card)] border border-border bg-surface p-6">
                <div className="flex items-start gap-3">
                  <Avatar name={review.name} />
                  <div className="min-w-0">
                    <p className="font-display text-lg leading-tight text-ink">
                      {review.name}
                    </p>
                    <p className="text-xs text-muted">{review.when}</p>
                  </div>
                </div>

                <Stars rating={review.rating} />

                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-ink-soft">
                  {review.text}
                </blockquote>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-12 rounded-[var(--radius-card)] border border-border bg-surface p-8 text-center">
            <h2 className="font-display text-2xl text-ink">
              Read them on Google
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
              Every review above was left on our Google Business Profile. See
              them there, or add your own after your next order.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <a
                href={site.contact.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
              >
                View on Google
              </a>
              {/* The g.page/r/.../review link opens Google's write-a-
                  review dialog directly, skipping the search-and-find
                  step that loses most people who meant to leave one.
                  Review count and recency are among the strongest local
                  ranking signals, so this deserves its own button. */}
              <a
                href={site.contact.reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border-2 border-ink px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-on-accent"
              >
                Leave a review
              </a>
              <Link
                href="/products"
                className="rounded-full border border-border px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
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

// Same palette and reasoning as the homepage: initials rather than stock
// photos of strangers, and colours that clear 4.5:1 against white text.
const AVATAR_COLOURS = ["#a83f5e", "#8a5e19", "#3d7a59", "#2f6f8f", "#7a4a8f"];

function Avatar({ name }: { name: string }) {
  const initials = name
    .replace(/[^\p{L}\s.]/gu, "")
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;

  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
      // Inline, not a Tailwind class: a runtime-selected arbitrary class
      // only renders if the stylesheet was generated with it, and a
      // stale sheet once made these invisible.
      style={{
        backgroundColor: AVATAR_COLOURS[hash % AVATAR_COLOURS.length],
        color: "#ffffff",
      }}
    >
      {initials || "?"}
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div
      className="mt-4 flex gap-0.5"
      role="img"
      aria-label={`${filled} out of 5 stars`}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          width="15"
          height="15"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill={i < filled ? STAR_FILL : STAR_EMPTY}
          stroke={i < filled ? STAR_EDGE : "#cfc4b6"}
          strokeWidth="1.4"
          strokeLinejoin="round"
        >
          <path d="M12 2.6l2.95 5.98 6.6.96-4.775 4.655 1.127 6.573L12 17.67l-5.902 3.098 1.127-6.573L2.45 9.54l6.6-.96z" />
        </svg>
      ))}
    </div>
  );
}
