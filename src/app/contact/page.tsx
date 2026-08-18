import type { Metadata } from "next";
import { site, fullAddress, telHref, whatsappHref } from "@/content/site";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
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
    email: site.contact.email,
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
          <Card title="Email" body={site.contact.email} href={`mailto:${site.contact.email}`} />
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
          ? "border-accent bg-accent text-white"
          : "border-border bg-surface"
      }`}
    >
      <p className={`font-display text-xl ${primary ? "text-white" : "text-ink"}`}>
        {title}
      </p>
      <p className={`mt-1.5 text-sm ${primary ? "text-white/85" : "text-muted"}`}>
        {body}
      </p>
    </a>
  );
}
