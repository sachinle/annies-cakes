import Link from "next/link";
import { site } from "@/content/site";
import { getPublishedProducts } from "@/lib/products";
import { getStoreStatus } from "@/lib/store-status";
import { StoreClosedNotice } from "@/components/StoreClosedNotice";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { Hero } from "@/components/home/Hero";
import { Marquee } from "@/components/home/Marquee";
import { Testimonials } from "@/components/home/Testimonials";
import { SafeImage } from "@/components/SafeImage";
import { Reveal } from "@/components/Reveal";

// The catalogue is the only thing fetched here — everything else is
// static content from src/content/site.ts.
export default async function Home() {
  const [products, store] = await Promise.all([
    getPublishedProducts(),
    getStoreStatus(),
  ]);
  const featured = products.filter((p) => p.isFeatured);
  const showcase = (featured.length > 0 ? featured : products).slice(0, 8);

  return (
    <>
      <Hero />

      <Marquee />

      {/* ── Products ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-4xl text-ink sm:text-5xl">
              Trending Cakes
            </h2>
            <Link
              href="/products"
              className="rounded-full border-2 border-ink px-6 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
            >
              See All →
            </Link>
          </div>
        </Reveal>

        {!store.acceptingOrders ? (
          <div className="mt-10">
            <StoreClosedNotice message={store.message} />
          </div>
        ) : showcase.length > 0 ? (
          <div className="mt-10">
            <ProductCarousel products={showcase} acceptingOrders />
          </div>
        ) : (
          <div className="mt-10 rounded-[var(--radius-card)] border-2 border-dashed border-border bg-surface p-12 text-center">
            <p className="font-display text-2xl text-ink">Menu coming up</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              Publish a few cakes in Leo Billing &rarr; Products and they&apos;ll
              appear here.
            </p>
          </div>
        )}
      </section>

      {/* ── Why choose us ────────────────────────────── */}
      <section className="bg-surface-soft py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <h2 className="text-center font-display text-4xl text-ink sm:text-5xl">
              {site.whyUs.heading}
            </h2>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {site.whyUs.items.map((item, i) => (
              <Reveal key={item.title} delay={i * 90}>
                <article className="h-full rounded-[var(--radius-card)] border border-border bg-surface p-8 text-center transition-shadow hover:shadow-[var(--shadow-soft)]">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-pink">
                    <WhyIcon name={item.icon} />
                  </div>
                  <h3 className="mt-5 font-display text-2xl text-ink">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {item.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] border border-border">
              <SafeImage
                src={site.about.image.src}
                alt={site.about.image.alt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
                label="Add a photo of your kitchen"
              />
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div>
              <h2 className="font-display text-4xl text-ink sm:text-5xl">
                {site.about.heading}
              </h2>
              <p className="mt-6 leading-relaxed text-ink-soft">{site.about.body}</p>
              <p className="mt-4 leading-relaxed text-ink-soft">{site.about.body2}</p>
              <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {site.stats.map((s) => (
                  <div key={s.label}>
                    <p className="font-display text-3xl text-accent">{s.value}</p>
                    <p className="mt-1 text-xs text-muted">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section className="bg-blush py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <h2 className="text-center font-display text-4xl text-ink sm:text-5xl">
              {site.howItWorks.heading}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-center text-sm text-ink-soft">
              {site.howItWorks.subheading}
            </p>
          </Reveal>

          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {site.howItWorks.steps.map((step, i) => (
              <Reveal key={step.title} delay={i * 80}>
                <li className="h-full rounded-[var(--radius-card)] bg-surface p-7">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink font-display text-lg text-white">
                    {i + 1}
                  </span>
                  <p className="mt-4 font-display text-xl text-ink">{step.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {step.body}
                  </p>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Most loved ───────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <h2 className="font-display text-4xl text-ink sm:text-5xl">
            {site.mostLoved.heading}
          </h2>
          <p className="mt-3 max-w-md text-sm text-ink-soft">
            {site.mostLoved.subheading}
          </p>
        </Reveal>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {site.mostLoved.items.map((item, i) => (
            <Reveal key={item.name} delay={i * 60}>
              <li className="flex h-full items-start gap-4 rounded-[var(--radius-card)] border border-border bg-surface p-6">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink font-display text-lg text-accent"
                >
                  {i + 1}
                </span>
                <div>
                  <p className="font-display text-xl text-ink">{item.name}</p>
                  <p className="mt-1 text-sm text-muted">{item.note}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ── Occasions ────────────────────────────────── */}
      <section className="bg-surface-soft py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <h2 className="font-display text-4xl text-ink sm:text-5xl">
              {site.occasions.heading}
            </h2>
            <p className="mt-3 max-w-lg text-sm text-ink-soft">
              {site.occasions.subheading}
            </p>
          </Reveal>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {site.occasions.items.map((item, i) => (
              <Reveal key={item.title} delay={i * 60}>
                <article className="h-full rounded-[var(--radius-card)] border border-border bg-surface p-7 transition-transform hover:-translate-y-1">
                  <h3 className="font-display text-2xl text-ink">{item.title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted">
                    {item.body}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gallery ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <h2 className="font-display text-4xl text-ink sm:text-5xl">
            {site.gallery.heading}
          </h2>
          <p className="mt-3 text-sm text-ink-soft">{site.gallery.subheading}</p>
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {site.gallery.images.map((img, i) => (
            <Reveal key={img.src} delay={i * 50}>
              <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
                <SafeImage
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  label={`Gallery photo ${i + 1}`}
                />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Reviews ──────────────────────────────────── */}
      <Testimonials />

      {/* ── FAQ ──────────────────────────────────────── */}
      <section className="bg-surface-soft py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Reveal>
            <h2 className="font-display text-4xl text-ink sm:text-5xl">
              {site.faq.heading}
            </h2>
          </Reveal>
          <div className="mt-10 space-y-3">
            {site.faq.items.map((item, i) => (
              <Reveal key={item.q} delay={i * 40}>
                <details className="group rounded-2xl border border-border bg-surface px-6 py-5">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-medium text-ink">
                    {item.q}
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
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────── */}
      <section className="bg-accent py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Reveal>
            <h2 className="font-display text-4xl text-white sm:text-5xl">
              {site.finalCta.heading}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-white/85">
              {site.finalCta.body}
            </p>
            <Link
              href={site.finalCta.cta.href}
              className="mt-9 inline-flex rounded-full bg-white px-8 py-4 text-sm font-semibold text-accent transition-transform hover:scale-105"
            >
              {site.finalCta.cta.label}
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function WhyIcon({ name }: { name: string }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    className: "text-accent",
    "aria-hidden": true,
  } as const;

  if (name === "home") {
    return (
      <svg {...common}>
        <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 9.5V20h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (name === "clock") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path
        d="M12 3l1.9 5.6L19.5 10l-4.6 3.4L16.4 19 12 15.9 7.6 19l1.5-5.6L4.5 10l5.6-1.4z"
        strokeLinejoin="round"
      />
    </svg>
  );
}
