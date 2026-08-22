"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

// Slim bar across the top of the page while a navigation is in flight.
//
// Why this exists: every route here is server-rendered per request (the
// root layout reads the session), so a click can sit for a moment with
// nothing on screen changing. Without feedback people click again —
// which is exactly the "takes two or three clicks" complaint.
//
// The App Router has no router-event API, so the bar is driven by
// watching link clicks and clearing when the pathname actually changes.
export function NavProgress() {
  const pathname = usePathname();
  // `startedAt` records the path the click began from. Keeping it in
  // state lets us clear the bar during render when the path changes,
  // instead of in an effect — an effect would paint the finished page
  // with the bar still on it for a frame.
  const [nav, setNav] = useState<{ active: boolean; from: string }>({
    active: false,
    from: pathname,
  });

  if (nav.active && nav.from !== pathname) {
    setNav({ active: false, from: pathname });
  }

  useEffect(() => {
    function onClick(event: MouseEvent) {
      // Let the browser handle anything that isn't a plain left-click
      // navigation: new tabs, downloads, modified clicks.
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }

      // External links leave the app; the browser shows its own spinner.
      if (url.origin !== window.location.origin) return;
      // Same page — no navigation will happen, so no bar.
      if (url.pathname === window.location.pathname && url.search === window.location.search) {
        return;
      }

      setNav({ active: true, from: window.location.pathname });
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!nav.active) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px]"
      role="progressbar"
      aria-label="Loading page"
    >
      <div
        // `key` restarts the animation for each new navigation, rather
        // than resuming a bar that's already crept to 90%.
        key={pathname + String(nav.active)}
        className="nav-progress h-full w-full bg-gradient-to-r from-accent via-peach to-yellow"
      />
    </div>
  );
}
