"use client";

import { useActionState } from "react";
import { requestPasswordReset, type AuthState } from "../actions";
import { Field, FormMessage, SubmitButton } from "@/components/auth/AuthShell";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    {}
  );

  if (state.message) return <FormMessage message={state.message} />;

  return (
    <form action={formAction}>
      <FormMessage error={state.error} />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
      />
      <SubmitButton pending={pending}>Send Reset Link</SubmitButton>
    </form>
  );
}
