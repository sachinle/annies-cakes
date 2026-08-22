import Link from "next/link";
import { site, telHref, whatsappHref } from "@/content/site";

// Fixed bottom bar, mobile only. Most visitors arrive from WhatsApp or
// Instagram on a phone, so talking to us and ordering stay one tap away.
export function MobileStickyBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-surface/95 backdrop-blur md:hidden">
      <a
        href={whatsappHref()}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-1 items-center justify-center py-3.5 text-sm font-medium text-ink-soft"
      >
        WhatsApp
      </a>
      <a
        href={telHref()}
        className="flex flex-1 items-center justify-center border-x border-border py-3.5 text-sm font-medium text-ink-soft"
      >
        Call
      </a>
      <Link
        href="/products"
        className="flex flex-1 items-center justify-center bg-accent py-3.5 text-sm font-semibold text-on-accent"
      >
        Order Now
      </Link>
      <span className="sr-only">{site.name}</span>
    </div>
  );
}
