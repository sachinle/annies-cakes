"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "./actions";
import { FormMessage, SubmitButton } from "@/components/auth/AuthShell";

export function ProfileForm({
  initialName,
  initialPhone,
  email,
}: {
  initialName: string;
  initialPhone: string;
  email: string;
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
