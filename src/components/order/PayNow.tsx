"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/order-schema";

// Pay by UPI.
//
// Tapping the button hands the phone a upi:// link, which opens the
// app chooser with the amount already filled in. Desktop browsers have
// nothing registered for that scheme, so nothing would happen there —
// hence the QR, which is the desktop path: scan it with the phone.
//
// The QR is rendered on the server and passed in as markup, so the QR
// library never ships to the browser.
export function PayNow({
  upiUri,
  qrSvg,
  amount,
  payeeName,
  vpa,
  invoiceNo,
}: {
  upiUri: string;
  qrSvg: string | null;
  amount: number;
  payeeName: string;
  vpa: string;
  invoiceNo: string;
}) {
  const [showQr, setShowQr] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyVpa() {
    try {
      await navigator.clipboard.writeText(vpa);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the ID is visible on screen anyway.
    }
  }

  return (
    <div className="mt-6 rounded-xl border border-accent/30 bg-accent/5 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-display text-lg text-ink">Pay by UPI</p>
        <p className="font-display text-2xl text-accent">{formatMoney(amount)}</p>
      </div>

      <p className="mt-1.5 text-sm text-ink-soft">
        Paying {payeeName} for invoice {invoiceNo}.
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        {/*
          A plain anchor, not a router Link — upi:// must be handed to
          the OS, and the router would try to treat it as a route.
        */}
        <a
          href={upiUri}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-all hover:bg-accent-hover hover:shadow-[var(--shadow-lift)]"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
            <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
            <path d="M2.5 10h19" strokeLinecap="round" />
          </svg>
          Pay {formatMoney(amount)} now
        </a>

        {qrSvg && (
          <button
            type="button"
            onClick={() => setShowQr((v) => !v)}
            aria-expanded={showQr}
            className="inline-flex items-center gap-2 rounded-full border border-accent px-6 py-3.5 text-sm font-semibold text-accent transition-colors hover:bg-accent hover:text-white"
          >
            {showQr ? "Hide QR code" : "Show QR code"}
          </button>
        )}
      </div>

      {showQr && qrSvg && (
        <div className="mt-5 flex flex-col items-center rounded-xl border border-border bg-white p-5">
          <div
            className="h-44 w-44 [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="mt-3 text-center text-xs text-muted">
            Scan with any UPI app — GPay, PhonePe, Paytm, BHIM
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-accent/20 pt-4 text-sm">
        <span className="text-muted">UPI ID:</span>
        <code className="rounded bg-surface px-2 py-1 text-ink">{vpa}</code>
        <button
          type="button"
          onClick={copyVpa}
          className="text-xs font-medium text-accent hover:underline"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Said plainly, because it's true: nothing here tells the site a
          payment happened. */}
      <p className="mt-3 text-xs leading-relaxed text-muted">
        Once you&apos;ve paid, we&apos;ll confirm it against our account and
        mark this bill as paid — it may take a little while to update here.
      </p>
    </div>
  );
}
