"use client";

import { useEffect, useRef, useState } from "react";

// Themed dropdown.
//
// A native <select> renders its option list with the operating system's
// own widget, which ignores page CSS entirely — that's why the default
// looked out of place against the pink theme.
//
// This keeps a real hidden <select> underneath so the value still
// submits with the form normally, and draws the visible list itself.
// Keyboard and screen-reader behaviour is provided explicitly rather
// than inherited, which is the cost of replacing a native control.
export function Select({
  name,
  options,
  defaultValue,
  placeholder = "Select…",
  ariaLabel,
}: {
  name: string;
  options: Array<{ value: string; label: string }>;
  defaultValue?: string;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  // Close when the customer clicks anywhere else.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function choose(v: string) {
    setValue(v);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") return setOpen(false);
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) choose(options[active]?.value ?? "");
      else setOpen(true);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActive((i) => {
        const next = e.key === "ArrowDown" ? i + 1 : i - 1;
        return Math.max(0, Math.min(options.length - 1, next));
      });
    }
  }

  return (
    <div ref={rootRef} className="relative">
      {/* The real control — hidden, but this is what the form reads. */}
      <select
        name={name}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-left text-ink outline-none transition-colors focus-visible:border-accent"
      >
        <span className={selected ? "" : "text-muted"}>
          {selected?.label ?? placeholder}
        </span>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" aria-hidden="true"
          className={`shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-border bg-surface p-1.5 shadow-[var(--shadow-lift)]"
        >
          {options.map((o, i) => {
            const isSelected = o.value === value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => choose(o.value)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors ${
                    isSelected
                      ? "bg-accent text-on-accent"
                      : i === active
                        ? "bg-pink text-ink"
                        : "text-ink-soft"
                  }`}
                >
                  {o.label}
                  {isSelected && (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
