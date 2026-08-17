"use client";

import { useActionState } from "react";
import { updatePassword, type AuthState } from "@/app/(auth)/actions";
import { Field, FormMessage, SubmitButton } from "@/components/auth/AuthShell";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    updatePassword,
    {}
  );

  return (
    <form action={formAction}>
      <FormMessage error={state.error} message={state.message} />
      <Field
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        hint="At least 8 characters."
      />
      <Field
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        minLength={8}
      />
      <SubmitButton pending={pending}>Update Password</SubmitButton>
    </form>
  );
}
