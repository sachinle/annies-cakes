"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { CartBadge } from "@/components/cart/CartBadge";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function HeaderNav({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // The mobile menu closes on the link tap itself rather than in an
  // effect watching the pathname — the tap is the actual event, and
  // routing to it through state-in-an-effect just adds a render.
  const close = () => setOpen(false);

  return (
    <>
      <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={pathname === link.href ? "page" : undefined}
            className={`text-sm font-medium transition-colors hover:text-accent ${
              pathname === link.href ? "text-accent" : "text-ink-soft"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <CartBadge />

        <Link
          href={signedIn ? "/account" : "/signin"}
          className="hidden rounded-full border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent md:inline-flex"
        >
          {signedIn ? "My Account" : "Sign In"}
        </Link>

        <Link
          href="/products"
          className="hidden rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover md:inline-flex"
        >
          Order Your Cake
        </Link>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-md text-ink md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav
          className="absolute inset-x-0 top-16 border-t border-border bg-surface px-4 pb-4 pt-2 md:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={close}
                  className="block rounded-md px-2 py-2.5 text-base font-medium text-ink-soft hover:bg-background hover:text-accent"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={signedIn ? "/account" : "/signin"}
                onClick={close}
                className="block rounded-md px-2 py-2.5 text-base font-medium text-ink-soft hover:bg-background hover:text-accent"
              >
                {signedIn ? "My Account" : "Sign In"}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </>
  );
}
