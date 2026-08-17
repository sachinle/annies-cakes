import Link from "next/link";
import { getUser } from "@/lib/supabase/server-auth";
import { siteConfig } from "@/lib/site-config";
import { HeaderNav } from "./HeaderNav";

export async function Header() {
  const user = await getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-display text-xl font-semibold text-ink">
          {siteConfig.shortName}
        </Link>
        <HeaderNav signedIn={Boolean(user)} />
      </div>
    </header>
  );
}
