import type { Metadata } from "next";
import { ObfuscatedEmail } from "@/components/ObfuscatedEmail";
// splitEmail comes from the plain module, not the client component:
// a server component may render a client component but cannot call
// a function exported from one.
import { splitEmail } from "@/lib/email-parts";
import { site, fullAddress, telHref, whatsappHref } from "@/content/site";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  alternates: { canonical: "/contact" },
  title: "Contact",
  description: `Call, WhatsApp, or visit ${site.name} in ${site.contact.city}.`,
};

// Static — no database call.
export default function ContactPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Bakery",
    // Same @id as the homepage block so search engines merge these into
    // one business instead of reading them as two.
    "@id": `${siteConfig.url}/#organization`,
    name: site.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    telephone: site.contact.phone,
    // email is deliberately NOT in the structured data.

    //

    // JSON-LD is plain text in the HTML, so putting the address here

    // undoes the client-side assembly used everywhere else and hands

    // it straight to harvesters. schema.org treats email as optional

    // and Google leans on name, url, logo, telephone and address for

    // local results — all of which are still here. Losing it costs

    // almost nothing; leaking the address costs spam forever.
    address: {
      "@type": "PostalAddress",
      streetAddress: site.contact.address,
      addressLocality: site.contact.city,
      addressRegion: site.contact.state,
      postalCode: site.contact.pincode,
      addressCountry: "IN",
    },
    openingHours: site.contact.hours,
    hasMap: site.contact.mapsUrl,
  };

  return (
    <div className="bg-blush">
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <h1 className="font-display text-5xl text-ink sm:text-6xl">Say Hello</h1>
        <p className="mt-4 max-w-md text-ink-soft">
          The quickest way to reach us is WhatsApp — we usually reply the same
          day.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <Card
            title="WhatsApp"
            body="Message us with your idea"
            href={whatsappHref("Hi! I'd like to ask about ordering a cake.")}
            external
            primary
          />
          <Card title="Call" body={site.contact.phone} href={telHref()} />
          {/* The address is assembled client-side rather than printed
              into the HTML, so bulk harvesters that never run
              JavaScript come away with nothing. */}
          <EmailCard title="Email" />
          <Card
            title="Find us"
            body={site.contact.city}
            href={site.contact.mapsUrl}
            external
          />
        </div>

        <div className="mt-8 rounded-[var(--radius-card)] border border-border bg-surface p-7">
          <p className="font-display text-xl text-ink">Where we are</p>
          <p className="mt-2 leading-relaxed text-ink-soft">{fullAddress}</p>
          <p className="mt-4 font-display text-xl text-ink">Opening hours</p>
          <p className="mt-2 text-ink-soft">{site.contact.hours}</p>
        </div>
      </section>
    </div>
  );
}

function Card({
  title,
  body,
  href,
  external = false,
  primary = false,
}: {
  title: string;
  body: string;
  href: string;
  external?: boolean;
  primary?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`rounded-[var(--radius-card)] border p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-soft)] ${
        primary
          ? "border-accent bg-accent text-on-accent"
          : "border-border bg-surface"
      }`}
    >
      <p className={`font-display text-xl ${primary ? "text-white" : "text-ink"}`}>
        {title}
      </p>
      <p className={`mt-1.5 text-sm ${primary ? "text-on-accent" : "text-muted"}`}>
        {body}
      </p>
    </a>
  );
}

/**
 * The Email card.
 *
 * Its own component because the address must not be printed into the
 * HTML — Card takes `body` and `href` as plain strings, which is exactly
 * what a harvester scrapes. ObfuscatedEmail assembles it in the browser
 * instead, so the served markup contains only the split halves.
 */
function EmailCard({ title }: { title: string }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]">
      <p className="font-display text-xl text-ink">{title}</p>
      <ObfuscatedEmail
        {...splitEmail(site.contact.email)}
        className="mt-1.5 block text-sm text-muted hover:text-accent"
      />
    </div>
  );
}
