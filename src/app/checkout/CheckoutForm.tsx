"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { placeCartOrder, type CheckoutState } from "./actions";
import { checkDeliveryPincode } from "@/app/products/[slug]/order/pincode-action";
import { useCart } from "@/components/cart/CartProvider";
import { DatePicker } from "@/components/ui/DatePicker";
import { Select } from "@/components/ui/Select";
import type { PincodeResult } from "@/lib/delivery";
import {
  MAX_MESSAGE_LENGTH,
  TIME_SLOTS,
  earliestOrderDate,
  formatMoney,
} from "@/lib/order-schema";

export function CheckoutForm({
  defaultName,
  defaultPhone,
}: {
  defaultName: string;
  defaultPhone: string;
}) {
  const { lines, total, ready } = useCart();
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    placeCartOrder,
    {}
  );

  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [pincode, setPincode] = useState("");
  const [pinResult, setPinResult] = useState<PincodeResult | null>(null);
  const [checkingPin, setCheckingPin] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // Per-cake personalisation. Each cake in a basket usually needs its
  // own message — one shared box would be wrong for a birthday order
  // that also includes a cake for someone else.
  const [details, setDetails] = useState<
    Record<string, { colour: string; cakeMessage: string }>
  >({});

  const errors = state.errors ?? {};

  function keyFor(productId: number, variantLabel: string | null) {
    return `${productId}::${variantLabel ?? ""}`;
  }

  function setDetail(key: string, field: "colour" | "cakeMessage", value: string) {
    setDetails((d) => {
      const current = d[key] ?? { colour: "", cakeMessage: "" };
      return { ...d, [key]: { ...current, [field]: value } };
    });
  }

  async function runPincodeCheck() {
    setCheckingPin(true);
    try {
      setPinResult(await checkDeliveryPincode(pincode));
    } catch {
      setPinResult({ serviceable: false, areaName: null, deliveryFee: 0 });
    } finally {
      setCheckingPin(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Only identifiers and quantities go to the server — prices are
  // re-read there from the database.
  const payload = JSON.stringify(
    lines.map((l) => {
      const d = details[keyFor(l.productId, l.variantLabel)];
      return {
        productId: l.productId,
        variantLabel: l.variantLabel,
        quantity: l.quantity,
        colour: d?.colour || undefined,
        cakeMessage: d?.cakeMessage || undefined,
      };
    })
  );

  if (!ready) {
    return <div className="mt-10 h-64 animate-pulse rounded-xl bg-surface" />;
  }

  if (lines.length === 0) {
    return (
      <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
        <p className="font-display text-xl text-ink">Your basket is empty</p>
        <Link
          href="/products"
          className="mt-6 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-hover"
        >
          Browse our cakes
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-10 space-y-10">
      <input type="hidden" name="lines" value={payload} />
      <input type="hidden" name="fulfillmentType" value={fulfillment} />
      {coords && (
        <>
          <input type="hidden" name="latitude" value={coords.lat} />
          <input type="hidden" name="longitude" value={coords.lng} />
        </>
      )}

      {state.formError && (
        <p role="alert" className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          {state.formError}
        </p>
      )}

      {/* ── Cakes + personalisation ──────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink">Your cakes</h2>
        <ul className="space-y-4">
          {lines.map((line) => {
            const key = keyFor(line.productId, line.variantLabel);
            return (
              <li key={key} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-display text-lg font-semibold text-ink">
                    {line.name}
                    {line.variantLabel && (
                      <span className="ml-2 text-sm font-normal text-muted">
                        {line.variantLabel}
                      </span>
                    )}
                  </p>
                  <p className="shrink-0 text-sm text-ink-soft">
                    × {line.quantity} · {formatMoney(line.unitPrice * line.quantity)}
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink">
                      Message on this cake
                    </label>
                    <input
                      maxLength={MAX_MESSAGE_LENGTH}
                      value={details[key]?.cakeMessage ?? ""}
                      onChange={(e) => setDetail(key, "cakeMessage", e.target.value)}
                      placeholder="Happy Birthday Priya!"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-ink">
                      Colour or theme
                    </label>
                    <input
                      maxLength={100}
                      value={details[key]?.colour ?? ""}
                      onChange={(e) => setDetail(key, "colour", e.target.value)}
                      placeholder="Pastel pink"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-ink outline-none placeholder:text-muted focus:border-accent"
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── When and where ───────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink">When and where</h2>
        <div className="space-y-4">
          <div className="flex gap-2">
            {(["pickup", "delivery"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFulfillment(type)}
                aria-pressed={fulfillment === type}
                className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium capitalize transition-colors ${
                  fulfillment === type
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-ink hover:border-accent"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date you need them" error={errors.preferredDate}>
              <DatePicker
                name="preferredDate"
                min={earliestOrderDate()}
                required
                placeholder="Pick a date"
              />
            </Field>
            <Field label="Preferred time">
              <Select
                name="preferredTime"
                ariaLabel="Preferred time"
                placeholder="No preference"
                defaultValue=""
                options={[
                  { value: "", label: "No preference" },
                  ...TIME_SLOTS.map((s) => ({ value: s, label: s })),
                ]}
              />
            </Field>
          </div>

          {fulfillment === "delivery" && (
            <>
              <div className="rounded-lg border border-border bg-surface p-4">
                <p className="text-sm font-medium text-ink">
                  First, can we deliver to you?
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    name="pincode"
                    inputMode="numeric"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => {
                      setPincode(e.target.value.replace(/\D/g, ""));
                      setPinResult(null);
                    }}
                    placeholder="Your 6-digit pincode"
                    className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3.5 py-2.5 text-ink outline-none placeholder:text-muted focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={runPincodeCheck}
                    disabled={pincode.length !== 6 || checkingPin}
                    className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-ink hover:border-accent hover:text-accent disabled:opacity-50"
                  >
                    {checkingPin ? "Checking…" : "Check"}
                  </button>
                </div>

                {errors.pincode && (
                  <p className="mt-2 text-xs text-error">{errors.pincode}</p>
                )}

                {pinResult?.serviceable && (
                  <p className="mt-3 text-sm text-success">
                    Yes — we deliver to {pinResult.areaName ?? "your area"}.
                    {pinResult.deliveryFee > 0 &&
                      ` Delivery is about ${formatMoney(pinResult.deliveryFee)}.`}
                  </p>
                )}

                {pinResult && !pinResult.serviceable && (
                  <div className="mt-3 rounded-lg border border-warning/30 bg-warning/10 p-3.5">
                    <p className="text-sm font-medium text-ink">
                      We don&apos;t deliver to {pincode} yet
                    </p>
                    <p className="mt-1.5 text-sm text-ink-soft">
                      You&apos;re welcome to collect. If you&apos;d rather have
                      them brought to you, you can book a courier such as Porter
                      or Rapido yourself — but once the cakes leave us with your
                      courier, we can&apos;t take responsibility for how they
                      travel.
                    </p>
                    <button
                      type="button"
                      onClick={() => setFulfillment("pickup")}
                      className="mt-3 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
                    >
                      Switch to pickup
                    </button>
                  </div>
                )}
              </div>

              {pinResult?.serviceable && (
                <>
                  <Field label="Delivery address" error={errors.address}>
                    <textarea
                      name="address"
                      rows={2}
                      placeholder="House / flat, street, area"
                      className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none placeholder:text-muted focus:border-accent"
                    />
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Landmark">
                      <input name="landmark" placeholder="Near…" className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none placeholder:text-muted focus:border-accent" />
                    </Field>
                    <Field label="City">
                      <input name="city" className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-accent" />
                    </Field>
                  </div>
                  <button
                    type="button"
                    onClick={useMyLocation}
                    disabled={locating}
                    className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-ink hover:border-accent hover:text-accent disabled:opacity-60"
                  >
                    {locating ? "Getting location…" : coords ? "Location attached ✓" : "Share my exact location"}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────── */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink">How we reach you</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" error={errors.contactName}>
            <input name="contactName" defaultValue={defaultName} autoComplete="name" required className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-accent" />
          </Field>
          <Field label="Phone" error={errors.contactPhone}>
            <input name="contactPhone" type="tel" defaultValue={defaultPhone} autoComplete="tel" required placeholder="98765 43210" className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none placeholder:text-muted focus:border-accent" />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Anything else we should know?" error={errors.specialInstructions}>
            <textarea
              name="specialInstructions"
              rows={3}
              placeholder="Allergies, design ideas, delivery timing…"
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none placeholder:text-muted focus:border-accent"
            />
          </Field>
        </div>
      </section>

      {/* ── Summary ──────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-soft">
            {lines.length} {lines.length === 1 ? "cake" : "different cakes"}
          </span>
          <span className="font-display text-2xl font-semibold text-ink">
            {formatMoney(total)}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted">
          An estimate. We&apos;ll confirm the final price with you — delivery or
          custom decoration may change it. Nothing is charged now.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white shadow-[var(--shadow-soft)] transition-all hover:bg-accent-hover hover:shadow-[var(--shadow-lift)] disabled:opacity-60"
        >
          {pending ? "Sending your request…" : "Send Order Request"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      {children}
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </div>
  );
}
