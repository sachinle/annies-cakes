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
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  /**
   * The element to render.
   *
   * Inside a <ul> or <ol> this MUST be "li". A <ul> may only contain
   * <li> children, so wrapping list items in a plain <div> — which is
   * what this component did everywhere — produced
   * `<ul><div><li>…</li></div></ul>`. Screen readers announce a list
   * and its item count from that structure, so a broken one means the
   * list stops being announced as a list at all.
   */
  as?: "div" | "li";
}) {
  const safeDelay = Math.min(Math.max(delay, 0), MAX_DELAY_MS);

  return (
    <Tag
      className={`reveal ${className}`}
      style={safeDelay ? { animationDelay: `${safeDelay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
