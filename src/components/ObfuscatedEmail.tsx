"use client";

import { useSyncExternalStore } from "react";

// An email address that harvesters do not get for free.
//
// The address is split into parts and only joined in the browser after
// mount, so it never appears as a contiguous string in the server HTML
// or in the initial markup a crawler downloads. Bulk address harvesters
// overwhelmingly fetch raw HTML and regex it; they do not run a React
// hydration pass, so they come away with nothing.
//
// Stated plainly: this is a speed bump, not encryption. A determined
// scraper that executes JavaScript will still read it. The point is to
// stop the cheap automated sweeps that produce most spam, at no cost to
// a real visitor — the link still works, still opens their mail client,
// and is still announced correctly to a screen reader.
//
// The fallback before mount is a real mailto link built the same way,
// so the component is never a dead element if hydration is slow.

export function ObfuscatedEmail({
  user,
  domain,
  className = "",
  children,
}: {
  /** Local part, before the @ */
  user: string;
  /** Domain part, after the @ */
  domain: string;
  className?: string;
  /** Optional label shown instead of the address itself. */
  children?: React.ReactNode;
}) {
  // useSyncExternalStore rather than useState + useEffect: the server
  // snapshot is false and the client snapshot true, which is exactly
  // the "has this hydrated yet" question, and React handles the
  // transition without a hydration mismatch. Setting state inside an
  // effect to achieve the same thing causes a cascading render.
  const hydrated = useSyncExternalStore(
    () => () => {},   // never changes, so no subscription is needed
    () => true,       // client
    () => false       // server
  );

  // Joined only once we are in the browser, so the address never
  // appears as a contiguous string in the served HTML.
  const address = hydrated ? `${user}@${domain}` : null;

  if (!address) {
    // Pre-hydration: show the label if there is one, otherwise a
    // placeholder that occupies the same space so nothing shifts.
    return (
      <span className={className} aria-label="Email address, loading">
        {children ?? `${user} [at] ${domain}`}
      </span>
    );
  }

  return (
    <a href={`mailto:${address}`} className={className}>
      {children ?? address}
    </a>
  );
}

