import type { ReactNode } from "react";

// A wrapper that fades and lifts its children in as the page renders.
//
// No "use client", no state, no observer — the whole effect is one CSS
// animation (see `.reveal` in globals.css). That is deliberate: the
// previous JavaScript version hid content until an IntersectionObserver
// fired, and when that didn't happen promptly, sections of the page
// stayed blank. A CSS animation always runs, so the content always
// arrives.
//
// `delay` staggers items in a list. Keep it small — the animation uses
// fill-mode `both`, so the element is invisible during its delay, and a
// long delay is just a long blank.
const MAX_DELAY_MS = 400;

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const safeDelay = Math.min(Math.max(delay, 0), MAX_DELAY_MS);

  return (
    <div
      className={`reveal ${className}`}
      style={safeDelay ? { animationDelay: `${safeDelay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
