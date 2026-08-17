import Link from "next/link";

// 404 with a CSS-animated cake — a slice lifting away from the whole,
// which is the joke: a missing piece. Drawn rather than a GIF so it's
// crisp at any size, follows the theme, and adds no download.
export default function NotFound() {
  return (
    <section className="bg-blush">
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center sm:px-6 sm:py-28">
        <MissingSliceCake />

        <p className="mt-2 font-display text-7xl leading-none text-accent sm:text-8xl">
          404
        </p>
        <h1 className="mt-4 font-display text-3xl text-ink sm:text-4xl">
          Someone took a slice
        </h1>
        <p className="mt-4 max-w-sm text-ink-soft">
          This page isn&apos;t here. The link may be old, or the cake may have
          come off the menu.
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/products"
            className="rounded-full bg-ink px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-accent"
          >
            Browse Our Cakes
          </Link>
          <Link
            href="/"
            className="rounded-full border-2 border-ink px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
          >
            Go Home
          </Link>
        </div>
      </div>
    </section>
  );
}

function MissingSliceCake() {
  return (
    <div className="relative h-40 w-52" aria-hidden="true">
      <svg viewBox="0 0 200 150" className="h-full w-full">
        {/* plate */}
        <ellipse cx="100" cy="132" rx="72" ry="9" className="fill-ink/10" />

        {/* the cake, minus one slice */}
        <g>
          <path
            d="M40 78h120v42a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8V78z"
            className="fill-accent"
          />
          <path
            d="M40 80c10 8 18-5 28 3s18-5 28 3 18-5 28 3 18-5 36 1v-9H40z"
            className="fill-surface"
          />
          <rect x="60" y="52" width="80" height="26" rx="6" className="fill-peach" />
          {/* cherries */}
          <circle cx="80" cy="48" r="5" className="fill-accent" />
          <circle cx="100" cy="44" r="5" className="fill-accent" />
          <circle cx="120" cy="48" r="5" className="fill-accent" />
        </g>

        {/* the slice, floating away */}
        <g
          style={{
            animation: "float-soft 3.4s ease-in-out infinite",
            transformOrigin: "170px 100px",
          }}
        >
          <path d="M156 84l30 10v30l-30-8V84z" className="fill-accent" />
          <path d="M156 84l30 10v-7l-30-9v6z" className="fill-surface" />
          <circle cx="171" cy="80" r="4" className="fill-accent" />
        </g>
      </svg>
    </div>
  );
}
