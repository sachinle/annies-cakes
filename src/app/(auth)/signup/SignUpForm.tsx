"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { signUp, type AuthState } from "../actions";
import { Field, FormMessage, SubmitButton } from "@/components/auth/AuthShell";
import { GoogleButton, OrDivider } from "@/components/auth/GoogleButton";

export function SignUpForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/account";

  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signUp,
    {}
  );

  // After a successful sign-up there's nothing to do in the form —
  // the next step is in their inbox.
  if (state.message) {
    return <FormMessage message={state.message} />;
  }

  return (
    <>
      <GoogleButton next={next} />
      <OrDivider />

      <form action={formAction}>
        <FormMessage error={state.error} />

        <Field
          label="Your name"
          name="fullName"
          autoComplete="name"
          placeholder="Priya Kumar"
        />
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          hint="At least 8 characters."
        />

        <SubmitButton pending={pending}>Create Account</SubmitButton>
      </form>
    </>
  );
}
