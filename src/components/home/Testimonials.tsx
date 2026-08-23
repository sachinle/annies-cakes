import { site } from "@/content/site";

// Customer reviews as a continuously scrolling carousel.
//
// Two rows drifting in opposite directions at different speeds — it
// reads as movement rather than a slideshow demanding attention, and
// it lets a lot of reviews sit in a small amount of page.
//
// Pure CSS animation on a duplicated track. No JS, no carousel
// library, and it pauses when the reader hovers so they can actually
// finish reading one.
export function Testimonials() {
  const items = site.testimonials.items;

  // Longer reviews first so the opening of each row has substance.
  const sorted = [...items].sort((a, b) => b.text.length - a.text.length);
  const half = Math.ceil(sorted.length / 2);
  const rows = [sorted.slice(0, half), sorted.slice(half)];

  return (
    <section className="overflow-hidden bg-surface-soft py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-accent">
            Reviews
          </p>
          <h2 className="mt-3 font-display text-4xl text-ink sm:text-5xl">
            {site.testimonials.heading}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm text-ink-soft">
            {site.testimonials.subheading}
          </p>
        </div>
      </div>

      <div className="mt-12 space-y-5">
        {rows.map((row, r) => (
          <div key={r} className="marquee">
            <div
              className="marquee__track gap-5"
              style={{
                // Second row drifts the other way and slightly slower,
                // so the two never march in lockstep.
                animationDirection: r === 1 ? "reverse" : "normal",
                animationDuration: r === 1 ? "68s" : "56s",
              }}
            >
              {[0, 1].map((copy) => (
                <div key={copy} className="flex shrink-0 gap-5" aria-hidden={copy === 1}>
                  {row.map((t) => (
                    <ReviewCard key={`${copy}-${t.name}`} {...t} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-6xl px-4 text-center sm:px-6">
        <a
          href={site.contact.reviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-full border-2 border-ink px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
        >
          Read them on Google →
        </a>
      </div>
    </section>
  );
}

function ReviewCard({
  name,
  when,
  rating,
  text,
}: {
  name: string;
  when: string;
  rating: number;
  text: string;
}) {
  return (
    <figure className="flex w-[320px] shrink-0 flex-col rounded-[var(--radius-card)] border border-border bg-surface p-6 sm:w-[380px]">
      <div className="flex items-center gap-3">
        <Avatar name={name} />
        <div className="min-w-0">
          <figcaption className="truncate text-sm font-semibold text-ink">
            {name}
          </figcaption>
          <p className="text-xs text-muted">{when}</p>
        </div>
      </div>

      <Stars rating={rating} />

      <blockquote className="mt-2.5 line-clamp-6 text-sm leading-relaxed text-ink-soft">
        {text}
      </blockquote>
    </figure>
  );
}

// Initials on a colour derived from the name.
//
// Deliberately not gendered illustrations: these are real customers,
// and guessing someone's gender from their name to pick a face gets it
// wrong often enough to be insulting. Initials are what Gmail, Slack
// and every other serious product do, and they never misrepresent
// anyone.
// These carry white initials, so each one has to clear 4.5:1 against
// white on its own. The previous set used --color-peach (1.78:1),
// --color-warning (2.93:1) and --color-success (3.87:1), all of which
// failed. These are fixed hex values rather than theme tokens because
// the theme tokens are tuned for surfaces and borders, not for being a
// text background.
// Plain hex, applied as an inline style rather than a Tailwind class.
//
// These were `bg-[#a83f5e]` and friends, chosen from this array at
// runtime. That works only if Tailwind's build-time scanner has emitted
// a rule for every one of them — which depends on the scanner, the dev
// cache and HMR all being in step. When any of those is stale the class
// resolves to nothing, the circle is transparent, and white initials on
// a white card vanish while still taking up space.
//
// An inline background has no build step to be out of step with. It is
// the one way to guarantee the avatar is never invisible.
//
// Each value clears 4.5:1 against white text (the ratio is noted), which
// is why they are fixed hex rather than theme tokens — the theme tokens
// are tuned for surfaces, not for carrying text.
const AVATAR_COLOURS = [
  "#a83f5e", // rose    5.94:1
  "#8a5e19", // amber   5.68:1
  "#3d7a59", // green   5.09:1
  "#2f6f8f", // blue    5.54:1
  "#7a4a8f", // violet  6.56:1
];

function Avatar({ name }: { name: string }) {
  const initials = name
    .replace(/[^\p{L}\s.]/gu, "")
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  // Stable per name, so the same reviewer always gets the same colour.
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const colour = AVATAR_COLOURS[hash % AVATAR_COLOURS.length];

  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold"
      style={{ backgroundColor: colour, color: "#ffffff" }}
    >
      {initials || "?"}
    </span>
  );
}

// Star rating.
//
// Drawn as SVG rather than the "★" character. A glyph renders
// differently on every platform (and on Android often as an emoji), and
// its colour is text, which WCAG holds to 4.5:1 — that forced the old
// #96661c, a gold so dark it read as brown.
//
// As a shape it is a graphic, which needs 3:1 for its *boundary*. The
// darker stroke supplies that (#a8721f is 4.12:1 on white), which frees
// the fill to be an actual gold.
//
// All five stars always render, with the unearned ones hollow, so a
// four-star review reads as four-out-of-five rather than just "four
// stars" floating with nothing to compare against.
const STAR_FILL = "#f5a623";
const STAR_EDGE = "#a8721f";
const STAR_EMPTY = "#e8e0d6";

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
