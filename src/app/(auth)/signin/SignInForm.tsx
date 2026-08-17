"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { signIn, type AuthState } from "../actions";
import { Field, FormMessage, SubmitButton } from "@/components/auth/AuthShell";
import { GoogleButton, OrDivider } from "@/components/auth/GoogleButton";

const LINK_ERRORS: Record<string, string> = {
  link_invalid: "That sign-in link wasn't valid. Please try again.",
  link_expired: "That link has expired. Request a new one below.",
};

export function SignInForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/account";
  const linkError = LINK_ERRORS[params.get("error") ?? ""];

  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signIn,
    {}
  );

  return (
    <>
      <GoogleButton next={next} />
      <OrDivider />

      <form action={formAction}>
        <FormMessage error={state.error ?? linkError} message={state.message} />
        <input type="hidden" name="next" value={next} />

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
          autoComplete="current-password"
        />

        <div className="mb-5 text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-muted hover:text-accent"
          >
            Forgot your password?
          </Link>
        </div>

        <SubmitButton pending={pending}>Sign In</SubmitButton>
      </form>
    </>
  );
}
