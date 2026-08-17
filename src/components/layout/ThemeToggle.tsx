"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";

// The theme lives on <html data-theme>, applied by the inline script in
// layout.tsx before first paint. That makes the DOM the source of truth,
// not React state — so this reads it with useSyncExternalStore rather
// than mirroring it into state inside an effect (which would cause a
// cascading render and get the first paint wrong).

let listeners: Array<() => void> = [];

function subscribe(callback: () => void) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

// Light is the default the server renders.
function getServerSnapshot(): Theme {
  return "light";
}

function applyTheme(theme: Theme) {
  if (theme === "dark") {
    document.documentElement.dataset.theme = "dark";
  } else {
    delete document.documentElement.dataset.theme;
  }
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // Private browsing can block storage; the toggle should still work
    // for this session.
  }
  listeners.forEach((l) => l());
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => applyTheme(isDark ? "light" : "dark")}
      className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-background hover:text-accent"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {/* pointer-events-none so a tap on the icon always counts as a
          tap on the button, never on the <path> inside it */}
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="pointer-events-none">
        {isDark ? (
          <>
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" strokeLinecap="round" />
          </>
        ) : (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}
