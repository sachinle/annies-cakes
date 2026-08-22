"use client";

import { useActionState, useState } from "react";
import { placeOrder, type OrderState } from "./actions";
import { checkDeliveryPincode } from "./pincode-action";
import type { PublicProduct } from "@/lib/product-types";
import type { PincodeResult } from "@/lib/delivery";
import {
  MAX_MESSAGE_LENGTH,
  MAX_QUANTITY,
  TIME_SLOTS,
  earliestOrderDate,
  formatMoney,
} from "@/lib/order-schema";

export function OrderForm({
  product,
  defaultName,
  defaultPhone,
}: {
  product: PublicProduct;
  defaultName: string;
  defaultPhone: string;
}) {
  const [state, formAction, pending] = useActionState<OrderState, FormData>(
    placeOrder,
    {}
  );

  const hasVariants = product.variants.length > 0;
  const [variantLabel, setVariantLabel] = useState(
    hasVariants ? product.variants[0].label : ""
  );
  const [quantity, setQuantity] = useState(1);
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [messageLength, setMessageLength] = useState(0);

  // Coordinates only exist if the customer explicitly shares them.
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");

  // Delivery serviceability. Null means "not checked yet" — the address
  // fields stay hidden until we know we can actually deliver there.
  const [pincode, setPincode] = useState("");
  const [pinResult, setPinResult] = useState<PincodeResult | null>(null);
  const [checkingPin, setCheckingPin] = useState(false);

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

  const unitPrice = hasVariants
    ? (product.variants.find((v) => v.label === variantLabel)?.price ??
       product.variants[0].price)
    : product.price;
  const total = unitPrice * quantity;

  const errors = state.errors ?? {};

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocateError("Your browser can't share location. Please type the address.");
      return;
    }
    setLocating(true);
    setLocateError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        });
        setLocating(false);
      },
      () => {
        setLocateError(
          "We couldn't get your location. Please type the address instead."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="slug" value={product.slug} />
      <input type="hidden" name="variantLabel" value={variantLabel} />
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

      {/* ── The cake ─────────────────────────────────── */}
      <Section title="Your cake">
        {hasVariants && (
          <Field label="Size">
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button
                  key={v.label}
                  type="button"
                  onClick={() => setVariantLabel(v.label)}
                  aria-pressed={variantLabel === v.label}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    variantLabel === v.label
                      ? "border-accent bg-accent text-on-accent"
                      : "border-border text-ink hover:border-accent"
                  }`}
                >
                  {v.label} · {formatMoney(v.price)}
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="How many?" error={errors.quantity}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="h-10 w-10 rounded-lg border border-border text-lg text-ink hover:border-accent"
              aria-label="Reduce quantity"
            >
              −
            </button>
            <input
              name="quantity"
              type="number"
              min={1}
              max={MAX_QUANTITY}
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.min(MAX_QUANTITY, Math.max(1, Number(e.target.value) || 1)))
              }
              className="w-20 rounded-lg border border-border bg-surface px-3 py-2.5 text-center text-ink outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
              className="h-10 w-10 rounded-lg border border-border text-lg text-ink hover:border-accent"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </Field>

        <Field label="Colour or theme" hint="e.g. pastel pink, jungle theme">
          <Input name="colour" placeholder="Leave blank if you're not fussy" />
        </Field>

        <Field
          label="Message on the cake"
          hint={`${messageLength}/${MAX_MESSAGE_LENGTH} characters`}
          error={errors.cakeMessage}
        >
          <Input
            name="cakeMessage"
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder="Happy Birthday Priya!"
            onChange={(e) => setMessageLength(e.target.value.length)}
          />
        </Field>
      </Section>

      {/* ── When and where ───────────────────────────── */}
      <Section title="When and where">
        <Field label="How would you like it?">
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
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date you need it" error={errors.preferredDate}>
            <Input name="preferredDate" type="date" min={earliestOrderDate()} required />
          </Field>
          <Field label="Preferred time">
            <Select name="preferredTime" defaultValue="">
              <option value="">No preference</option>
              {TIME_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </Field>
        </div>

        {fulfillment === "delivery" && (
          <>
            {/* Serviceability gate: check before anything else is filled in,
                so nobody completes a long form only to be turned away. */}
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
                  className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
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
                    You&apos;re very welcome to collect from us. If you&apos;d
                    rather have it brought to you, you can book a courier such
                    as Porter or Rapido yourself — but please note that once
                    the cake leaves us with your courier, we can&apos;t take
                    responsibility for how it travels.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFulfillment("pickup")}
                    className="mt-3 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover"
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
                    <Input name="landmark" placeholder="Near…" />
                  </Field>
                  <Field label="City">
                    <Input name="city" />
                  </Field>
                </div>
              </>
            )}

            {pinResult?.serviceable && (
            <div className="rounded-lg border border-border bg-surface p-4">
              <p className="text-sm font-medium text-ink">
                Share your exact location
              </p>
              <p className="mt-1 text-xs text-muted">
                Optional, but it makes finding you much easier than an address
                alone. We only use it for this delivery.
              </p>
              <button
                type="button"
                onClick={useMyLocation}
                disabled={locating}
                className="mt-3 rounded-full border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
              >
                {locating ? "Getting location…" : coords ? "Update location" : "Use my current location"}
              </button>
              {coords && (
                <p className="mt-2 text-xs text-success">
                  Location attached ({coords.lat}, {coords.lng})
                </p>
              )}
              {locateError && <p className="mt-2 text-xs text-error">{locateError}</p>}
            </div>
            )}
          </>
        )}
      </Section>

      {/* ── Contact ──────────────────────────────────── */}
      <Section title="How we reach you">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name" error={errors.contactName}>
            <Input name="contactName" defaultValue={defaultName} autoComplete="name" required />
          </Field>
          <Field label="Phone" error={errors.contactPhone}>
            <Input
              name="contactPhone"
              type="tel"
              defaultValue={defaultPhone}
              autoComplete="tel"
              placeholder="98765 43210"
              required
            />
          </Field>
        </div>

        <Field label="Anything else we should know?" error={errors.specialInstructions}>
          <textarea
            name="specialInstructions"
            rows={3}
            placeholder="Allergies, design ideas, delivery timing…"
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none placeholder:text-muted focus:border-accent"
          />
        </Field>
      </Section>

      {/* ── Summary + submit ─────────────────────────── */}
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-ink-soft">
            {product.name}
            {variantLabel && ` · ${variantLabel}`}
            {quantity > 1 && ` × ${quantity}`}
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
          className="mt-5 w-full rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover disabled:opacity-60"
        >
          {pending ? "Sending your request…" : "Send Order Request"}
        </button>
      </div>
    </form>
  );
}

// ── Small presentational helpers ────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-ink">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      {children}
      {error ? (
        <p className="mt-1.5 text-xs text-error">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none placeholder:text-muted focus:border-accent"
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none focus:border-accent"
    />
  );
}
