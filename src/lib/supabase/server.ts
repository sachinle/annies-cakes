import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-only client — uses the service role key, which bypasses RLS
// entirely. The "server-only" import guard means importing this from a
// Client Component fails the build instead of silently leaking the key
// into the browser bundle.
//
// Use this for privileged, curated reads (e.g. the public product
// catalogue, selecting only customer-safe columns and never `stock` or
// `gst_rate`) and for server-side writes that must not be reachable by
// an arbitrary anon-key holder (e.g. changing an order's status).
// Because RLS does not apply here, never interpolate unvalidated
// request input into a query on this client.
//
// The client is created lazily on first use rather than at import time:
// a missing env var should fail the one route that needs the database,
// not take down every page in the app including static ones.

let client: SupabaseClient | null = null;

function createAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase server client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (service role key is server-only — never prefix it with NEXT_PUBLIC_)."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!client) client = createAdminClient();
  return client;
}
