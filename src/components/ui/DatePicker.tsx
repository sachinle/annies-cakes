"use client";

import { useEffect, useRef, useState } from "react";

// Themed date picker.
//
// Same reasoning as the Select: a native date input opens the browser's
// own calendar, which can't be styled and looks foreign against the
// theme. This draws its own month grid and keeps a hidden text input
// holding the ISO value so the form submits exactly as before.
//
// Dates before `min` are disabled rather than hidden, so the customer
// can see that the early part of the month exists but isn't available.

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function DatePicker({
  name,
  min,
  required,
  placeholder = "Pick a date",
}: {
  name: string;
  min?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const start = min ? new Date(`${min}T00:00:00`) : new Date();
    return new Date(start.getFullYear(), start.getMonth(), 1);
  });
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: Array<number | null> = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const pretty = value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
        weekday: "short", day: "numeric", month: "long", year: "numeric",
      })
    : "";

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" name={name} value={value} required={required} />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-left outline-none transition-colors focus-visible:border-accent"
      >
        <span className={value ? "text-ink" : "text-muted"}>
          {pretty || placeholder}
        </span>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="shrink-0 text-accent">
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Choose a date"
          className="absolute z-30 mt-2 w-[300px] rounded-2xl border border-border bg-surface p-4 shadow-[var(--shadow-lift)]"
        >
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              aria-label="Previous month"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-pink"
            >
              ‹
            </button>
            <p className="font-display text-base text-ink">
              {MONTHS[month]} {year}
            </p>
            <button
              type="button"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              aria-label="Next month"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-pink"
            >
              ›
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1">
            {DAY_LABELS.map((d, i) => (
              <span key={i} className="py-1 text-center text-[11px] font-medium text-muted">
                {d}
              </span>
            ))}

            {cells.map((day, i) => {
              if (day === null) return <span key={`b${i}`} />;

              const dayIso = iso(new Date(year, month, day));
              const disabled = min ? dayIso < min : false;
              const isSelected = dayIso === value;

              return (
                <button
                  key={dayIso}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    setValue(dayIso);
                    setOpen(false);
                  }}
                  className={`flex h-9 items-center justify-center rounded-full text-sm transition-colors ${
                    isSelected
                      ? "bg-accent font-semibold text-on-accent"
                      : disabled
                        ? "cursor-not-allowed text-muted/40"
                        : "text-ink hover:bg-pink"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => { setValue(""); setOpen(false); }}
              className="mt-3 w-full rounded-xl py-2 text-xs font-medium text-muted hover:text-accent"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
