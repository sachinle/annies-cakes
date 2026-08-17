"use client";

import Image from "next/image";
import { useState } from "react";

// An image that degrades to a labelled placeholder instead of a broken
// icon. Every photo slot on the site uses this, so the design holds
// together before any real photography has been added — and if a file
// is ever renamed or missing in production, the page still looks
// deliberate rather than broken.
export function SafeImage({
  src,
  alt,
  fill = true,
  width,
  height,
  sizes,
  priority = false,
  className = "",
  label,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  label?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-1 bg-pink/40 text-center"
        aria-hidden="true"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-accent/50">
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <circle cx="9" cy="10" r="1.6" />
          <path d="M3 16l5-4 4 3 3-2 6 5" strokeLinejoin="round" />
        </svg>
        <span className="px-3 text-[11px] font-medium text-accent/70">
          {label ?? alt}
        </span>
      </div>
    );
  }

  // `alt` is written out on each element rather than folded into the
  // shared props object — spreading it hides it from the accessibility
  // linter, which is exactly the check worth keeping honest here.
  const common = {
    src,
    sizes,
    priority,
    onError: () => setFailed(true),
    className,
  };

  return fill ? (
    <Image {...common} alt={alt} fill />
  ) : (
    <Image {...common} alt={alt} width={width ?? 800} height={height ?? 600} />
  );
}
