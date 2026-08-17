// Shown wherever an order button would normally be, while the shop is
// closed. The cake is drawn in CSS rather than loaded as a GIF: it
// scales cleanly, follows the theme, weighs nothing, and honours
// prefers-reduced-motion — none of which a GIF does.
export function StoreClosedNotice({ message }: { message: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border-2 border-dashed border-accent/35 bg-pink/40 p-8 text-center">
      <SleepingCake />
      <p className="mt-5 font-display text-2xl text-ink">
        We&apos;re closed right now
      </p>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-soft">
        {message}
      </p>
    </div>
  );
}

function SleepingCake() {
  return (
    <div className="relative mx-auto h-24 w-32" aria-hidden="true">
      {/* Zzz drifting upward, staggered so they don't move as a block */}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute font-display text-accent/70"
          style={{
            left: `${58 + i * 13}%`,
            top: `${18 - i * 6}%`,
            fontSize: `${11 + i * 4}px`,
            animation: `float-soft ${2.6 + i * 0.5}s ease-in-out ${i * 0.35}s infinite`,
          }}
        >
          z
        </span>
      ))}

      <svg viewBox="0 0 120 90" className="h-full w-full">
        {/* plate */}
        <ellipse cx="60" cy="80" rx="44" ry="6" className="fill-ink/10" />
        {/* bottom tier */}
        <rect x="24" y="52" width="72" height="26" rx="6" className="fill-accent" />
        {/* cream */}
        <path
          d="M24 54c8 6 14-4 22 2s14-4 22 2 14-4 22 2v-6H24z"
          className="fill-surface"
        />
        {/* top tier */}
        <rect x="40" y="34" width="40" height="20" rx="5" className="fill-peach" />
        {/* candle, unlit */}
        <rect x="58" y="22" width="4" height="12" rx="2" className="fill-ink/70" />
        {/* wisp of smoke from a blown-out candle */}
        <path
          d="M60 20c3-3-3-5 0-8"
          className="stroke-muted"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
