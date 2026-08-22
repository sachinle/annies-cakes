import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/server-auth";
import { signOut } from "@/app/(auth)/actions";

const navLinks = [
  { href: "/account", label: "Profile" },
  { href: "/account/orders", label: "My Orders" },
  { href: "/account/settings", label: "Settings" },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The proxy already redirects unauthenticated visitors, but this is
  // the check that actually matters — a proxy can be bypassed, a
  // server-side getUser() cannot.
  const user = await getUser();
  if (!user) redirect("/signin?next=/account");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="grid gap-8 md:grid-cols-[200px_1fr]">
        <aside>
          {/* Horizontal strip on mobile, sidebar on desktop. The strip
              scrolls rather than wraps — three tabs plus Sign out don't
              fit on a 360px phone, and wrapping was dropping Sign out
              onto its own ragged second line. */}
          <nav
            aria-label="Account"
            className="-mx-4 flex items-center gap-1 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-col md:items-stretch md:overflow-visible md:px-0 md:pb-0"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-surface hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
            {/* Pushed to the far end on mobile so it reads as a separate
                action, and dropped below the links on desktop. */}
            <form action={signOut} className="ml-auto shrink-0 md:ml-0 md:mt-4 md:border-t md:border-border md:pt-4">
              <button
                type="submit"
                className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-error"
              >
                Sign out
              </button>
            </form>
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
