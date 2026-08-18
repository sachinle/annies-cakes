"use client";

import { useEffect, useRef, useState } from "react";

// Share a cake.
//
// On a phone the tap goes straight to the OS share sheet, which is what
// people expect and gives them WhatsApp, Instagram DM, contacts and
// everything else they already use. Desktop browsers mostly don't
// implement navigator.share, so those fall back to an explicit menu.
//
// The decision is made at click time rather than during render: probing
// `navigator.share` while rendering would differ between server and
// browser and cause a hydration mismatch.

type Props = {
  url: string;
  title: string;
  text: string;
  className?: string;
  compact?: boolean;
  /** Which way the fallback menu opens. Cards need "down"; a button
   *  near the bottom of a page needs "up". */
  placement?: "up" | "down";
};

export function ShareButton({
  url,
  title,
  text,
  className = "",
  compact = false,
  placement = "up",
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape, so the menu never gets stranded open.
  useEffect(() => {
    if (!menuOpen) return;

    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  async function onShareClick() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // AbortError means they dismissed the sheet — do nothing rather
        // than popping our own menu straight after they said no.
        return;
      }
    }
    setMenuOpen((v) => !v);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Older browsers, and any page not on HTTPS.
      const el = document.createElement("textarea");
      el.value = url;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      el.remove();
    }
    setCopied(true);
    setMenuOpen(false);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const share = `${text}\n\n${url}`;

  const targets = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(share)}`,
      icon: <WhatsAppIcon />,
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      icon: <FacebookIcon />,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      icon: <TelegramIcon />,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      icon: <XIcon />,
    },
  ];

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={onShareClick}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={`Share ${title}`}
        className={
          compact
            ? "flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-ink shadow-[var(--shadow-soft)] backdrop-blur transition-colors hover:text-accent"
            : "inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
        }
      >
        <ShareIcon />
        {!compact && <span>{copied ? "Link copied" : "Share"}</span>}
      </button>

      {menuOpen && (
        <div
          role="menu"
          className={`absolute z-30 w-52 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-[var(--shadow-lift)] ${
            placement === "down"
              ? "right-0 top-full mt-2"
              : "bottom-full left-0 mb-2"
          }`}
        >
          {targets.map((t) => (
            <a
              key={t.label}
              role="menuitem"
              href={t.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink transition-colors hover:bg-surface-soft hover:text-accent"
            >
              <span className="text-muted">{t.icon}</span>
              {t.label}
            </a>
          ))}
          <button
            type="button"
            role="menuitem"
            onClick={copyLink}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink transition-colors hover:bg-surface-soft hover:text-accent"
          >
            <span className="text-muted"><LinkIcon /></span>
            Copy link
          </button>
        </div>
      )}

      {/* Announced to screen readers; the visible label changes too. */}
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied to clipboard" : ""}
      </span>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────

const stroke = {
  width: 17,
  height: 17,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function ShareIcon() {
  return (
    <svg {...stroke}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg {...stroke}>
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
    </svg>
  );
}

const solid = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": true } as const;

function WhatsAppIcon() {
  return (
    <svg {...solid}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.9-4.45 9.9-9.91C21.95 6.45 17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.42 1.3-1.96 1.34-.5.05-.99.23-3.35-.7-2.82-1.11-4.6-3.99-4.74-4.18-.14-.18-1.13-1.5-1.13-2.86 0-1.36.71-2.03.96-2.31.25-.28.55-.35.73-.35.18 0 .37 0 .53.01.17.01.4-.06.62.48.24.57.8 1.97.87 2.11.07.14.12.31.02.5-.09.18-.14.3-.28.46-.14.16-.29.36-.42.48-.14.14-.28.29-.12.57.16.28.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07.17-.19.7-.81.88-1.09.19-.28.37-.23.63-.14.25.09 1.63.77 1.9.91.28.14.46.21.53.32.07.11.07.63-.17 1.31Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg {...solid}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg {...solid}>
      <path d="M21.94 4.6 18.9 19.2c-.23 1.02-.84 1.27-1.7.79l-4.7-3.47-2.27 2.19c-.25.25-.46.46-.95.46l.34-4.8 8.75-7.9c.38-.34-.08-.53-.59-.19l-10.8 6.8-4.66-1.45c-1.01-.32-1.03-1.01.21-1.5L20.63 3.1c.84-.31 1.58.2 1.31 1.5Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg {...solid}>
      <path d="M17.53 3h3.02l-6.6 7.54L21.75 21h-6.08l-4.76-6.22L5.46 21H2.44l7.06-8.07L2.25 3h6.23l4.3 5.69L17.53 3Zm-1.06 16.18h1.67L7.6 4.72H5.8l10.67 14.46Z" />
    </svg>
  );
}
