import type { Metadata } from "next";
import Link from "next/link";
import { site, whatsappHref } from "@/content/site";
import { SafeImage } from "@/components/SafeImage";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "About Us",
  description: `How ${site.name} started in 2019 and how we still bake today — to order, by hand, in a home kitchen in ${site.contact.city}.`,
};

const about = site.aboutPage;

export default function AboutPage() {
  return (
    <>
      {/* ── Intro ────────────────────────────────────── */}
      <section className="bg-blush">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-accent">
              {about.eyebrow}
            </p>
            <h1 className="mt-5 font-display text-[2.8rem] leading-[1.05] text-ink sm:text-6xl">
              {about.heading}
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
              {about.lede}
            </p>
          </div>

          <div className="relative aspect-square overflow-hidden rounded-full border-[6px] border-surface shadow-[0_24px_60px_rgba(224,92,120,0.24)]">
            <SafeImage
              src={site.hero.images[0].src}
              alt={site.hero.images[0].alt}
              fill
              priority
              sizes="(max-width: 768px) 90vw, 500px"
              className="object-cover"
              label="Add a photo"
            />
          </div>
        </div>
      </section>

      {/* ── Timeline ─────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <ol className="relative">
          {/* Vertical rail linking the chapters. */}
          <span
            aria-hidden="true"
            className="absolute bottom-6 left-[13px] top-3 w-0.5 bg-border sm:left-[15px]"
          />

          {about.chapters.map((chapter, i) => (
            <Reveal as="li" key={chapter.year} delay={i * 80}>
              <div className="relative flex gap-6 pb-12 last:pb-0">
                <span
                  aria-hidden="true"
                  className="relative z-10 mt-1 h-7 w-7 shrink-0 rounded-full border-4 border-background bg-accent sm:h-8 sm:w-8"
                />
                <div className="pt-0.5">
                  <p className="font-display text-sm tracking-wide text-accent">
                    {chapter.year}
                  </p>
                  <h2 className="mt-1.5 font-display text-2xl text-ink sm:text-3xl">
                    {chapter.title}
                  </h2>
                  <p className="mt-3 leading-relaxed text-ink-soft">
                    {chapter.body}
                  </p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ── Numbers ──────────────────────────────────── */}
      <section className="bg-accent py-14">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 sm:px-6 md:grid-cols-4">
          {site.stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-4xl text-on-accent sm:text-5xl">
                {s.value}
              </p>
              <p className="mt-1.5 text-sm text-on-accent">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Values ───────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <Reveal>
          <h2 className="font-display text-4xl text-ink sm:text-5xl">
            {about.valuesHeading}
          </h2>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {about.values.map((value, i) => (
            <Reveal key={value.title} delay={i * 70}>
              <article className="h-full rounded-[var(--radius-card)] border border-border bg-surface p-7">
                <h3 className="font-display text-2xl text-ink">{value.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{value.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Gallery strip ────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {site.gallery.images.slice(0, 3).map((img, i) => (
            <Reveal key={img.src} delay={i * 60}>
              <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
                <SafeImage
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="33vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  label={`Photo ${i + 1}`}
                />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Closing ──────────────────────────────────── */}
      <section className="bg-surface-soft py-16 sm:py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <Reveal>
            <h2 className="font-display text-4xl text-ink sm:text-5xl">
              {about.closing.heading}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-ink-soft">
              {about.closing.body}
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                href="/products"
                className="rounded-full bg-ink px-8 py-4 text-sm font-semibold text-on-accent transition-colors hover:bg-accent"
              >
                See the Menu
              </Link>
              <a
                href={whatsappHref("Hi! I'd like to ask about a cake.")}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border-2 border-ink px-8 py-4 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
              >
                Talk to Us
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
