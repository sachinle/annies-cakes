"use client";

import Link from "next/link";
import { useEffect } from "react";

// Route-level error boundary. Customers see a plain, useful message —
// never a stack trace or a raw Postgres/Supabase error, which can leak
// table names and internal structure. The real error still goes to the
// server logs via console.error on the server render, and to the
// browser console only in development.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <section className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-semibold sm:text-3xl">
        Something went wrong on our side
      </h1>
      <p className="mt-4 text-ink-soft">
        This one is on us, not you. Please try again in a moment — or message
        us directly and we&apos;ll sort it out.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Try again
        </button>
        <Link
          href="/contact"
          className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Contact us
        </Link>
      </div>
    </section>
  );
}
