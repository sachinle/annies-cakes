// Cake loader: layers drop in, a cherry lands on top, sprinkles fall.
//
// Deliberately CSS-only. A loader driven by JavaScript is worthless
// here, because the thing being waited for is very often JavaScript
// itself — so the animation would freeze at exactly the moment it's
// supposed to reassure someone.
//
// Sizes are in `em` and driven by the wrapper's font-size, so one
// component covers a full-page fallback and a button spinner.

const SPRINKLES = [
  { left: "18%", delay: "0s", color: "var(--color-yellow)" },
  { left: "34%", delay: "0.35s", color: "var(--color-peach)" },
  { left: "52%", delay: "0.7s", color: "var(--color-accent)" },
  { left: "68%", delay: "0.2s", color: "var(--color-yellow)" },
  { left: "82%", delay: "0.55s", color: "var(--color-peach)" },
];

export function CakeLoader({
  label = "Baking your page",
  size = 96,
  className = "",
}: {
  /** Shown under the cake. Pass null for a bare, decorative loader. */
  label?: string | null;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        className="relative"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {/* Sprinkles fall behind the cake so they never obscure it. */}
        {SPRINKLES.map((s) => (
          <span
            key={s.left}
            className="cake-loader__sprinkle absolute top-0 block rounded-full"
            style={{
              left: s.left,
              width: size * 0.055,
              height: size * 0.11,
              background: s.color,
              animationDelay: s.delay,
            }}
          />
        ))}

        <div className="cake-loader__stack absolute inset-x-0 bottom-0 flex flex-col items-center">
          {/* Cherry */}
          <span
            className="cake-loader__cherry block rounded-full bg-[var(--color-accent)]"
            style={{
              width: size * 0.17,
              height: size * 0.17,
              animationDelay: "0.75s",
              marginBottom: size * 0.02,
            }}
          />

          {/* Frosting — the widest, lands last. */}
          <span
            className="cake-loader__layer block bg-surface"
            style={{
              width: size * 0.72,
              height: size * 0.15,
              borderRadius: `${size * 0.09}px ${size * 0.09}px ${size * 0.04}px ${size * 0.04}px`,
              animationDelay: "0.5s",
              boxShadow: "0 2px 0 color-mix(in srgb, var(--color-accent) 18%, transparent)",
            }}
          />

          {/* Two sponge layers, bottom one widest. */}
          <span
            className="cake-loader__layer block bg-[var(--color-pink)]"
            style={{
              width: size * 0.66,
              height: size * 0.17,
              borderRadius: size * 0.03,
              animationDelay: "0.25s",
            }}
          />
          <span
            className="cake-loader__layer block bg-[var(--color-peach)]"
            style={{
              width: size * 0.8,
              height: size * 0.19,
              borderRadius: size * 0.03,
              animationDelay: "0s",
            }}
          />

          {/* Plate, with a shine sweeping across it. */}
          <span
            className="relative mt-[2px] block overflow-hidden bg-ink"
            style={{
              width: size * 0.96,
              height: size * 0.07,
              borderRadius: size * 0.04,
            }}
          >
            <span
              className="cake-loader__shine absolute inset-y-0 w-1/3"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
              }}
            />
          </span>
        </div>
      </div>

      {label && (
        <p className="cake-loader__label mt-5 font-display text-lg text-ink">
          {label}
        </p>
      )}
      {/* Screen readers get a plain, stable message — the animated dots
          would otherwise be announced over and over. */}
      <span className="sr-only">Loading</span>
    </div>
  );
}
