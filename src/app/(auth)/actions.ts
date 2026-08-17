"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server-auth";

// Server Actions for customer authentication.
//
// All validation happens here, on the server — client-side checks are a
// convenience for the customer, never a control. Error messages are
// deliberately vague about whether an account exists, so this can't be
// used to discover which emails are registered.

export type AuthState = { error?: string; message?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): string | null {
  if (!EMAIL_RE.test(email)) return "Please enter a valid email address.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 200) return "That password is too long.";
  return null;
}

async function siteUrl() {
  // Prefer the configured public URL; fall back to the request host so
  // OAuth/redirects work in dev without extra setup.
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function signIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/account");

  if (!EMAIL_RE.test(email) || !password) {
    return { error: "Please enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Same message for "no such account" and "wrong password" — telling
    // them apart lets anyone enumerate registered customers.
    return { error: "That email or password doesn't look right." };
  }

  redirect(safeNext(next));
}

export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();

  const invalid = validate(email, password);
  if (invalid) return { error: invalid };
  if (fullName.length < 2) return { error: "Please tell us your name." };
  if (fullName.length > 100) return { error: "That name is too long." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${await siteUrl()}/auth/callback`,
    },
  });

  if (error) {
    return { error: "We couldn't create that account. Please try again." };
  }

  return {
    message:
      "Check your email — we've sent you a link to confirm your account.",
  };
}

export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteUrl()}/auth/callback?next=/account/password`,
  });

  // Always the same response, whether or not the account exists.
  return {
    message:
      "If there's an account with that email, we've sent a reset link to it.",
  };
}

export async function updatePassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) return { error: "Those passwords don't match." };

  const supabase = await createClient();

  // updateUser only succeeds for an authenticated session, so a valid
  // recovery link (or an active login) is required — a password can't
  // be changed by anyone who isn't already holding the session.
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "We couldn't update your password. Try the link again." };
  }

  return { message: "Your password has been updated." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// Only allow same-site relative paths after sign-in, so a crafted
// ?next=https://evil.example can't turn this into an open redirect.
function safeNext(next: string): string {
  if (!next.startsWith("/") || next.startsWith("//")) return "/account";
  return next;
}
