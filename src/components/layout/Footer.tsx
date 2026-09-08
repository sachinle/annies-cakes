import Link from "next/link";
import { ObfuscatedEmail } from "@/components/ObfuscatedEmail";
// splitEmail comes from the plain module, not the client component:
// a server component may render a client component but cannot call
// a function exported from one.
import { splitEmail } from "@/lib/email-parts";
import { site, fullAddress, telHref, whatsappHref } from "@/content/site";
import {
  WhatsAppIcon, InstagramIcon, FacebookIcon, ThreadsIcon, YouTubeIcon,
} from "@/components/SocialIcons";

const exploreLinks = [
  { href: "/products", label: "All Cakes" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About Us" },
];

const helpLinks = [
  { href: "/contact", label: "Contact" },
  { href: "/account/orders", label: "Track My Order" },
];

// Static — no database call.
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-display text-2xl text-ink">{site.name}</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">
              Homemade cakes, baked fresh to order in {site.contact.city}.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <SocialLink href={whatsappHref()} label="WhatsApp">
                <WhatsAppIcon className="h-[18px] w-[18px]" />
              </SocialLink>
              <SocialLink href={site.contact.instagram} label="Instagram">
                <InstagramIcon className="h-[18px] w-[18px]" />
              </SocialLink>
              <SocialLink href={site.contact.facebook} label="Facebook">
                <FacebookIcon className="h-[18px] w-[18px]" />
              </SocialLink>
              <SocialLink href={site.contact.threads} label="Threads">
                <ThreadsIcon className="h-[18px] w-[18px]" />
              </SocialLink>
              <SocialLink href={site.contact.youtube} label="YouTube">
                <YouTubeIcon className="h-[18px] w-[18px]" />
              </SocialLink>
            </div>
          </div>

          <FooterColumn title="Explore" links={exploreLinks} />
          <FooterColumn title="Help" links={helpLinks} />

          <div>
            <p className="font-display text-lg text-ink">Get in touch</p>
            <ul className="mt-4 space-y-2.5 text-sm text-muted">
              <li>
                <a href={telHref()} className="hover:text-accent">
                  {site.contact.phone}
                </a>
              </li>
              <li>
                {/* Assembled in the browser, so the address is never a
                    contiguous string in the HTML a harvester downloads. */}
                <ObfuscatedEmail
                  {...splitEmail(site.contact.email)}
                  className="hover:text-accent"
                />
              </li>
              <li className="pt-1">{site.contact.hours}</li>
              <li className="leading-relaxed">{fullAddress}</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {site.name}. All rights reserved.</p>
          <p>Made fresh, order by order.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div>
      <p className="font-display text-lg text-ink">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-muted hover:text-accent">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Renders nothing when the link is blank, so an unused network simply
// doesn't appear rather than linking somewhere broken.
function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-pink text-ink transition-all hover:-translate-y-0.5 hover:bg-accent hover:text-on-accent"
    >
      {children}
    </a>
  );
}
