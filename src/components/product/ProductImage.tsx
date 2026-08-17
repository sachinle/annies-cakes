"use client";

import Image from "next/image";
import { useRef, useState } from "react";

// Product photo with magnify-on-hover.
//
// The zoom is a CSS transform driven by the pointer position, so there
// is no second high-resolution request and nothing to load before it
// works. Touch devices get a tap-to-open lightbox instead, since hover
// doesn't exist there and a stuck zoom would be worse than none.
export function ProductImage({
  src,
  alt,
}: {
  src: string | null;
  alt: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState("50% 50%");
  const [zoomed, setZoomed] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  if (!src) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-border bg-surface text-sm text-muted">
        Photo coming soon
      </div>
    );
  }

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  return (
    <>
      <div
        ref={frameRef}
        onMouseMove={onMove}
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
        onClick={() => setLightbox(true)}
        className="group relative aspect-[4/3] cursor-zoom-in overflow-hidden rounded-2xl border border-border bg-surface"
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover transition-transform duration-300 ease-out"
          style={{
            transformOrigin: origin,
            transform: zoomed ? "scale(1.9)" : "scale(1)",
          }}
        />
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-ink/70 px-3 py-1.5 text-xs font-medium text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
          Hover to zoom · tap to enlarge
        </span>
      </div>

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setLightbox(false)}
          className="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4"
        >
          <div className="relative h-full max-h-[85vh] w-full max-w-4xl">
            <Image src={src} alt={alt} fill className="object-contain" sizes="100vw" />
          </div>
          <button
            type="button"
            onClick={() => setLightbox(false)}
            aria-label="Close"
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
