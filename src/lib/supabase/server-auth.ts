import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Server-side client that acts AS THE SIGNED-IN CUSTOMER.
//
// Distinct from `server.ts`, which uses the service role key and
// bypasses RLS. This one carries the customer's session, so RLS still
// applies — which is exactly what we want for anything customer-facing.
// If a query here would return another customer's data, the database
// stops it; we are not relying on remembering a `.eq('customer_id', …)`
// filter in application code.
//
// Never derive identity from anything the client sends. Use
// `getUser()` below, which verifies the token with Supabase.

export async function createClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — check .env.local"
    );
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The proxy refreshes the session instead, so this is safe to
          // ignore.
        }
      },
    },
  });
}

/**
 * The verified current user, or null.
 *
 * Uses getUser() rather than getSession(): getSession() trusts whatever
 * is in the cookie, while getUser() revalidates the token with Supabase.
 * Authorisation decisions must only ever use this.
 */
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
