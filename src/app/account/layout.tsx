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
          <nav aria-label="Account" className="flex gap-1 md:flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-surface hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
            <form action={signOut} className="mt-2 md:mt-4">
              <button
                type="submit"
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-error"
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
