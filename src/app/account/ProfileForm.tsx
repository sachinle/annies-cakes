"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "./actions";
import { FormMessage, SubmitButton } from "@/components/auth/AuthShell";

export function ProfileForm({
  initialName,
  initialPhone,
  email,
  initialAddress = "",
  initialLandmark = "",
  initialCity = "",
  initialPincode = "",
}: {
  initialName: string;
  initialPhone: string;
  email: string;
  initialAddress?: string;
  initialLandmark?: string;
  initialCity?: string;
  initialPincode?: string;
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateProfile,
    {}
  );

  return (
    <form action={formAction}>
      <FormMessage error={state.error} message={state.message} />

      <div className="mb-4">
        <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-ink">
          Your name
        </label>
        <input
          id="fullName"
          name="fullName"
          defaultValue={initialName}
          required
          autoComplete="name"
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none transition-colors focus:border-accent"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-ink">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={initialPhone}
          autoComplete="tel"
          placeholder="+91 98765 43210"
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none transition-colors placeholder:text-muted focus:border-accent"
        />
        <p className="mt-1.5 text-xs text-muted">
          This is how we&apos;ll reach you about your order.
        </p>
      </div>

      {/* Saved once here, filled in automatically at checkout. Optional
          throughout — plenty of customers only ever collect. */}
      <fieldset className="mb-6 mt-2 rounded-xl border border-border p-4">
        <legend className="px-2 text-sm font-medium text-ink">
          Delivery address{" "}
          <span className="font-normal text-muted">(optional)</span>
        </legend>
        <p className="mb-4 text-xs text-muted">
          Save it once and we&apos;ll fill it in for you next time you order.
        </p>

        <label htmlFor="address" className="mb-1.5 block text-sm font-medium text-ink">
          Address
        </label>
        <textarea
          id="address"
          name="address"
          rows={2}
          maxLength={300}
          defaultValue={initialAddress}
          autoComplete="street-address"
          placeholder="House / flat, street, area"
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none transition-colors placeholder:text-muted focus:border-accent"
        />

        <label htmlFor="landmark" className="mb-1.5 mt-3 block text-sm font-medium text-ink">
          Landmark
        </label>
        <input
          id="landmark"
          name="landmark"
          maxLength={120}
          defaultValue={initialLandmark}
          placeholder="Near the temple, opposite the school…"
          className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none transition-colors placeholder:text-muted focus:border-accent"
        />

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="city" className="mb-1.5 block text-sm font-medium text-ink">
              City
            </label>
            <input
              id="city"
              name="city"
              maxLength={80}
              defaultValue={initialCity}
              autoComplete="address-level2"
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none transition-colors focus:border-accent"
            />
          </div>
          <div>
            <label htmlFor="pincode" className="mb-1.5 block text-sm font-medium text-ink">
              Pincode
            </label>
            <input
              id="pincode"
              name="pincode"
              inputMode="numeric"
              maxLength={6}
              pattern="\d{6}"
              defaultValue={initialPincode}
              autoComplete="postal-code"
              placeholder="641001"
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-ink outline-none transition-colors placeholder:text-muted focus:border-accent"
            />
          </div>
        </div>
      </fieldset>

      <div className="mb-6">
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
          Email
        </label>
        <input
          id="email"
          value={email}
          disabled
          className="w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-muted"
        />
        <p className="mt-1.5 text-xs text-muted">
          Your email is how you sign in and can&apos;t be changed here.
        </p>
      </div>

      <SubmitButton pending={pending}>Save Changes</SubmitButton>
    </form>
  );
}
