"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser client for customer authentication.
//
// Uses the public anon key only. Everything reachable through it is
// governed by the RLS policies in supabase/migrations — a customer can
// only ever see their own profile, orders, and reviews, because those
// policies compare `auth.uid()` to the row's owner. The anon key being
// public is expected and safe under that model.
//
// Sessions are stored in cookies (not localStorage) so Server
// Components and the proxy can read them too.

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — check .env.local"
    );
  }

  return createBrowserClient(url, key);
}
