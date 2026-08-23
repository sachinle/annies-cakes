"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";

// Floating bottom navigation, mobile only.
//
// Four destinations either side of a raised basket button, which sits in
// a hump moulded out of the bar itself. Replaces a flat three-button
// strip (WhatsApp / Call / Order Now) that was really three shortcuts —
// it told you nothing about where you were, and the site's sections
// were only reachable through the hamburger.
//
// All styling lives in globals.css under `.mnav*` rather than in
// utility classes. The geometry needs exact values, and arbitrary-value
// Tailwind classes only render if the stylesheet the browser is holding
// was generated with them in it — a stale cached stylesheet had already
// collapsed this bar once and stranded the button at the screen edge.

type Item = {
  href: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
};

const iconProps = (active: boolean) => ({
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  // A solid fill on active flattened the detailed icons into blobs —
  // the Gallery frame became a filled rectangle with its picture
  // lost. The outline is kept in every state and the active fill is
  // translucent, so the shape stays readable while still reading as
  // selected.
  fill: active ? "currentColor" : "none",
  fillOpacity: active ? 0.18 : 0,
  stroke: "currentColor",
  strokeWidth: active ? 1.9 : 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "mnav__icon",
  "aria-hidden": true,
});

const ITEMS: Item[] = [
  {
    href: "/",
    label: "Home",
    icon: (a) => (
      <svg {...iconProps(a)}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.6V20h13V9.6" />
        {/* Door, explicitly unfilled so it stays a doorway rather
            than vanishing into the house when the icon is active. */}
        <path d="M10 20v-4.4a2 2 0 0 1 4 0V20" fill="none" />
      </svg>
    ),
  },
  {
    href: "/products",
    label: "Cakes",
    // An actual cake — a tiered dome with a cherry — rather than the
    // magnifying glass this slot had. It is a cake shop; the icon should
    // say so at a glance.
    icon: (a) => (
      <svg {...iconProps(a)}>
        <circle cx="12" cy="3.6" r="1.1" />
        <path d="M12 4.7v2.4" />
        <path d="M5 19v-4.2a7 7 0 0 1 14 0V19" />
        <path d="M3.5 19h17" />
        <path d="M5.4 14.4c1.1 0 1.1 1.5 2.2 1.5s1.1-1.5 2.2-1.5 1.1 1.5 2.2 1.5 1.1-1.5 2.2-1.5 1.1 1.5 2.2 1.5 1.1-1.5 2.2-1.5" fill="none" />
      </svg>
    ),
  },
  {
    href: "/gallery",
    label: "Gallery",
    icon: (a) => (
      <svg {...iconProps(a)}>
        <rect x="3" y="4.5" width="18" height="15" rx="3" />
        {/* Sun and hills stay unfilled, so the frame reads as a picture
            instead of a solid block when active. */}
        <circle cx="8.4" cy="9.6" r="1.5" fill="none" />
        <path d="M3.6 16.8l4.6-4.1 3.3 2.8 2.9-2.4 5.6 4.6" fill="none" />
      </svg>
    ),
  },
  {
    href: "/account",
    label: "Account",
    icon: (a) => (
      <svg {...iconProps(a)}>
        <circle cx="12" cy="8" r="3.6" />
        <path d="M4.6 20a7.4 7.4 0 0 1 14.8 0" />
      </svg>
    ),
  },
];

export function MobileStickyBar() {
  const pathname = usePathname();
  const { count, ready } = useCart();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const left = ITEMS.slice(0, 2);
  const right = ITEMS.slice(2);

  return (
    <nav aria-label="Quick navigation" className="mnav md:hidden">
      <div className="mnav__stack">
      {/* The bar and the hump live inside one wrapper whose drop-shadow
          traces both, so the outline reads as a single continuous edge
          rather than two shapes with a seam between them. The basket
          button sits outside it, or the shadow would balloon around the
          button as well. */}
      <div className="mnav__shape">
        <span className="mnav__hump" aria-hidden="true" />

        <div className="mnav__bar">
          <Tab item={left[0]} active={isActive(left[0].href)} />
          <span className="mnav__divider" aria-hidden="true" />
          <Tab item={left[1]} active={isActive(left[1].href)} />

        {/* Reserves the space the raised button occupies. Without it the
            four tabs spread evenly and the button covers two of them. */}
          <span className="mnav__slot" aria-hidden="true" />

          <Tab item={right[0]} active={isActive(right[0].href)} />
          <span className="mnav__divider" aria-hidden="true" />
          <Tab item={right[1]} active={isActive(right[1].href)} />
        </div>
      </div>

      {/* Outside .mnav__shape on purpose: that wrapper carries a filter
          drop-shadow to trace the bar silhouette, and a filter applies
          to every descendant — leaving the button inside would wrap it
          in the same shadow and lose its own. */}
      <Link
        href="/cart"
        className="mnav__fab"
          aria-label={
            ready && count > 0
              ? `Basket, ${count} item${count === 1 ? "" : "s"}`
              : "Basket"
          }
        >
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3.2 9.4h17.6l-1.5 8.9a2.2 2.2 0 0 1-2.2 1.8H6.9a2.2 2.2 0 0 1-2.2-1.8Z" />
          <path d="M8.4 9.4 10.6 4.2M15.6 9.4 13.4 4.2" />
          <path d="M9.7 13v3.4M14.3 13v3.4" />
        </svg>

        {ready && count > 0 && (
          <span className="mnav__badge">{count > 9 ? "9+" : count}</span>
        )}
      </Link>
      </div>
    </nav>
  );
}

function Tab({ item, active }: { item: Item; active: boolean }) {
  return (
    <Link
      href={item.href}
      className="mnav__tab"
      aria-current={active ? "page" : undefined}
    >
      {item.icon(active)}
      <span className="mnav__label">{item.label}</span>
      <span className="mnav__dot" aria-hidden="true" />
    </Link>
  );
}
