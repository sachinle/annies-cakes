"use client";

import { useState } from "react";
import { checkDeliveryLocation } from "@/app/checkout/location-action";
import type { LocationResult } from "@/lib/delivery";

// "Can you deliver to me?" answered by the customer's own phone.
//
// Replaces typing a pincode. A pincode is a postal sorting code, not a
// delivery boundary — 641032 covers several square kilometres, so it
// says yes to people the shop would never ride to and no to people two
// streets away. A GPS position against a drawn area is the real answer.
//
// The verdict comes from the server. This component only collects the
// coordinates and shows what it is told; it never decides. The same
// check runs again when the order is submitted, so a stale or tampered
// result here cannot get an out-of-range order through.

type Props = {
  /** Told to the parent so it can enable the address fields. */
  onResult: (result: LocationResult, coords: { lat: number; lng: number }) => void;
};

export function LocationCheck({ onResult }: Props) {
  const [state, setState] = useState<"idle" | "locating" | "checking" | "done">("idle");
  const [result, setResult] = useState<LocationResult | null>(null);
  const [error, setError] = useState("");

  function check() {
    setError("");
    setResult(null);

    if (!("geolocation" in navigator)) {
      setError("This device can't share its location. Please choose pickup, or message us.");
      return;
    }

    setState("locating");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setState("checking");
        try {
          const r = await checkDeliveryLocation(coords.lat, coords.lng);
          setResult(r);
          onResult(r, coords);
          setState("done");
        } catch {
          setError("We couldn't check that just now. Please try again.");
          setState("idle");
        }
      },
      (err) => {
        setState("idle");
        // Each case needs a different next step, so they get different
        // messages rather than one shrug.
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            "Location permission was blocked. Allow it in your browser settings, or choose pickup instead."
          );
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError("Your device couldn't get a position. Try again outdoors, or choose pickup.");
        } else {
          setError("That took too long. Please try again.");
        }
      },
      // High accuracy matters when a boundary is a few hundred metres
      // away. maximumAge 0 forces a fresh fix rather than a cached one
      // from wherever the phone was last used.
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  const busy = state === "locating" || state === "checking";

  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <p className="font-medium text-ink">Can we deliver to you?</p>
      <p className="mt-1 text-sm text-muted">
        We&apos;ll check your location against the area we deliver to. Nothing
        is stored unless you place an order.
      </p>

      <button
        type="button"
        onClick={check}
        disabled={busy}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 21s7-6.4 7-11a7 7 0 1 0-14 0c0 4.6 7 11 7 11Z" />
          <circle cx="12" cy="10" r="2.6" />
        </svg>
        {state === "locating"
          ? "Finding you…"
          : state === "checking"
            ? "Checking…"
            : result
              ? "Check again"
              : "Check my location"}
      </button>

      {error && (
        <p className="mt-3 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}

      {result && !error && (
        <div
          role="status"
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            result.serviceable
              ? "border-success/30 bg-success/10 text-success"
              : "border-warning/40 bg-warning/10 text-ink"
          }`}
        >
          {result.serviceable ? (
            <>
              <strong>Yes — we deliver to you.</strong>
              {result.zoneName && <> You&apos;re in our {result.zoneName} area.</>}
              {result.deliveryFee > 0 && (
                <> Delivery is about ₹{result.deliveryFee.toFixed(0)}.</>
              )}
            </>
          ) : (
            <>
              <strong>You&apos;re outside our delivery area.</strong>
              {result.distanceText && (
                <> You&apos;re about {result.distanceText} from us.</>
              )}{" "}
              You can still collect from us, or message us on WhatsApp and
              we&apos;ll see what we can do.
            </>
          )}
        </div>
      )}
    </div>
  );
}
