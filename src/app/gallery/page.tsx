import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/content/site";
import { SafeImage } from "@/components/SafeImage";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos of cakes we've made for real orders.",
};

// Static — images come from src/content/site.ts.
export default function GalleryPage() {
  return (
    <div className="bg-blush">
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <h1 className="font-display text-5xl text-ink sm:text-6xl">
          {site.gallery.heading}
        </h1>
        <p className="mt-4 max-w-lg text-ink-soft">{site.gallery.subheading}</p>

        <div className="mt-12 columns-2 gap-4 lg:columns-3 [&>*]:mb-4">
          {site.gallery.images.map((img, i) => (
            <Reveal key={img.src} delay={i * 50}>
              <figure className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-surface">
                <div className="relative aspect-square">
                  <SafeImage
                    src={img.src}
                    alt={img.alt}
                    fill
                    priority={i < 3}
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    label={`Gallery photo ${i + 1}`}
                  />
                </div>
              </figure>
            </Reveal>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/products"
            className="inline-flex rounded-full bg-ink px-8 py-4 text-sm font-semibold text-white transition-colors hover:bg-accent"
          >
            Order a Cake
          </Link>
        </div>
      </section>
    </div>
  );
}
