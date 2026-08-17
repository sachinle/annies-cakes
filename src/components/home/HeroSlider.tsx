"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

// Hero carousel.
//
// Scrolling is native CSS scroll-snap — no carousel library, no drag
// handlers to get wrong, and it works with touch, trackpad, and
// keyboard for free. The only JS here is the auto-advance and the dots.
//
// Auto-advance stops on hover, on focus within, and whenever the
// customer scrolls it themselves: taking control back from someone
// mid-look is the most irritating thing a carousel can do.
export function HeroSlider({
  images,
}: {
  images: Array<{ url: string; alt: string }>;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const scrollTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: track.clientWidth * i, behavior: "smooth" });
  }, []);

  // Keep the dots in step with wherever the customer has scrolled.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setIndex(Math.round(track.scrollLeft / track.clientWidth));
      });
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (paused || images.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      const next = (index + 1) % images.length;
      scrollTo(next);
    }, 5000);
    return () => clearInterval(id);
  }, [index, images.length, paused, scrollTo]);

  if (images.length === 0) return null;

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        className="snap-row aspect-[4/3] overflow-hidden rounded-2xl border border-border"
        // Touch scrolling is the customer taking over; don't fight it.
        onTouchStart={() => setPaused(true)}
      >
        {images.map((img, i) => (
          <div key={img.url} className="relative h-full w-full">
            <Image
              src={img.url}
              alt={img.alt}
              fill
              priority={i === 0}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => scrollTo(i)}
              aria-label={`Show photo ${i + 1} of ${images.length}`}
              aria-current={i === index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? "w-7 bg-accent" : "w-1.5 bg-border hover:bg-muted"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
