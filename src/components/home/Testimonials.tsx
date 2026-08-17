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

      <div className="mt-4 text-sm text-peach" aria-label={`${rating} out of 5`}>
        {"★".repeat(rating)}
      </div>

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
const AVATAR_COLOURS = [
  "bg-accent",
  "bg-peach",
  "bg-ink",
  "bg-success",
  "bg-warning",
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
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${colour}`}
    >
      {initials || "?"}
    </span>
  );
}
