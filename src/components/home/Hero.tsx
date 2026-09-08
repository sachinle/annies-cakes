"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SafeImage } from "@/components/SafeImage";
import { site, whatsappHref } from "@/content/site";

// Hero with the copy and the photo advancing together every 5 seconds.
//
// Both sides are driven by one index, so text and image always belong to
// the same slide rather than drifting apart on two timers.
//
// The copy has no dots by design — the words change on their own and
// reading them is the point; controls would only invite fiddling. The
// photo keeps its dots because a customer might genuinely want to look
// at a particular cake again.
const ROTATE_MS = 5000;

export function Hero() {
  const slides = site.hero.slides;
  const images = site.hero.images;
  const steps = Math.max(slides.length, images.length);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (steps < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => setIndex((i) => (i + 1) % steps), ROTATE_MS);
    return () => clearInterval(id);
  }, [steps]);

  return (
    <section className="bg-blush">
      {/* Slightly wider text column than image column — the words are
          what sell the cake, and a 1:1 split left the copy looking
          undersized against a large round photo. */}
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.15fr_1fr] md:gap-14 md:py-20 lg:gap-20">
        {/* ── Copy ─────────────────────────────────── */}
        <div className="relative">
          {/* THIS must be display:grid. Every slide is placed in the same
              cell (grid-area 1/1) so they overlap and cross-fade in
              place; the container then sizes itself to the tallest one,
              which also stops the layout jumping between slides.
              Without grid here the slides simply stack down the page. */}
          {/* A reserved minimum height, so nothing below the hero can be
              pushed around by the copy resizing — whether that is the
              slide rotating to longer text or a webfont landing and
              re-flowing a 4.4rem heading. Layout shift above the fold is
              the most expensive kind. */}
          <div className="grid min-h-[19rem] sm:min-h-[22rem] lg:min-h-[24rem]">
            {slides.map((s, i) => {
              const isCurrent = i === index % slides.length;
              return (
                <div
                  key={s.headingBottom}
                  className="col-start-1 row-start-1 transition-opacity duration-700 ease-in-out"
                  style={{
                    opacity: isCurrent ? 1 : 0,
                    // Hidden slides sit invisibly on top of the visible
                    // one, so they must not swallow clicks.
                    pointerEvents: isCurrent ? "auto" : "none",
                  }}
                  aria-hidden={!isCurrent}
                >
                  <span className="inline-block rounded-full bg-surface px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-accent sm:text-xs">
                    {s.eyebrow}
                  </span>

                  {/* Only the first slide is a real <h1>.
                      All five slides live in the DOM at once so they can
                      cross-fade, which previously meant the page shipped
                      five <h1> elements — search engines and screen
                      readers both read every one of them, not just the
                      visible slide. The rest are styled divs, so the
                      document has exactly one top-level heading. */}
                  <Heading as={i === 0 ? "h1" : "div"}>
                    {s.headingTop}
                    <span className="ml-3 align-middle font-sans text-2xl font-light italic text-accent sm:text-3xl">
                      {s.headingAccent}
                    </span>
                    <br />
                    {s.headingBottom}
                  </Heading>

                  <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ink-soft sm:text-base">
                    {s.body}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Buttons sit outside the rotation — they never change, and
              re-rendering them would break a click mid-transition. */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={site.hero.primaryCta.href}
              className="rounded-full bg-ink px-8 py-4 text-sm font-semibold text-on-accent shadow-[var(--shadow-soft)] transition-all hover:bg-accent hover:shadow-[var(--shadow-lift)]"
            >
              {site.hero.primaryCta.label}
            </Link>
            <a
              href={whatsappHref("Hi! I'd like a custom cake.")}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-ink px-8 py-4 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
            >
              {site.hero.secondaryCta.label}
            </a>
          </div>
        </div>

        {/* ── Photo ────────────────────────────────── */}
        <div className="relative mx-auto w-full max-w-[420px] lg:max-w-[440px]">
          <div className="relative aspect-square">
            <div
              aria-hidden="true"
              className="absolute inset-[3%] rounded-full bg-gradient-to-br from-pink via-peach/30 to-yellow/30 blur-xl"
            />

            <div className="float-soft relative h-full w-full">
              <div className="relative h-full w-full overflow-hidden rounded-full border-[6px] border-surface shadow-[0_22px_55px_rgba(224,92,120,0.26)]">
                {images.map((img, i) => (
                  <div
                    key={img.src}
                    className="absolute inset-0 transition-opacity duration-[1100ms] ease-in-out"
                    style={{ opacity: i === index % images.length ? 1 : 0 }}
                    aria-hidden={i !== index % images.length}
                  >
                    <SafeImage
                      src={img.src}
                      alt={img.alt}
                      fill
                      priority={i === 0}
                      fetchPriority={i === 0 ? "high" : undefined}
                      sizes="(max-width: 768px) 85vw, 440px"
                      className="object-cover"
                      label="Add hero photo"
                    />
                  </div>
                ))}
              </div>

              <div className="absolute -right-2 top-5 rotate-6 rounded-2xl bg-yellow px-4 py-2 shadow-[var(--shadow-soft)]">
                <p className="font-display text-sm leading-tight text-ink">
                  Baked
                  <br />
                  Fresh
                </p>
              </div>
            </div>
          </div>

          {images.length > 1 && (
            <div className="mt-5 flex justify-center gap-2">
              {images.map((img, i) => (
                <button
                  key={img.src}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show cake ${i + 1}`}
                  aria-current={i === index % images.length}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === index % images.length
                      ? "w-8 bg-accent"
                      : "w-2 bg-accent/25 hover:bg-accent/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Heading({
  as: Tag,
  children,
}: {
  as: "h1" | "div";
  children: React.ReactNode;
}) {
  return (
    <Tag className="mt-5 font-display text-[3rem] leading-[0.95] text-ink sm:text-[3.8rem] lg:text-[4.4rem]">
      {children}
    </Tag>
  );
}
