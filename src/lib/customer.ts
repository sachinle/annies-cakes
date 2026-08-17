import "server-only";
import { createClient } from "@/lib/supabase/server-auth";

// The signed-in customer's own profile row.
//
// Every read and write here goes through the customer's own session, so
// RLS enforces that they can only ever touch their own row — the
// database is the guarantee, not this code.

export type CustomerProfile = {
  id: string;
  fullName: string | null;
  phone: string | null;
  email: string | null;
};

/**
 * Fetch the current customer's profile, creating it on first visit.
 * A Supabase auth user exists as soon as they sign up, but the profile
 * row is created lazily here rather than via a database trigger, so
 * there's one less piece of hidden behaviour to reason about.
 */
export async function getOrCreateProfile(): Promise<CustomerProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("website_customers")
    .select("id, full_name, phone")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      fullName: existing.full_name,
      phone: existing.phone,
      email: user.email ?? null,
    };
  }

  // Seed the name from whatever the sign-up or Google account provided.
  const seedName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null;

  const { data: created } = await supabase
    .from("website_customers")
    .insert({ id: user.id, full_name: seedName })
    .select("id, full_name, phone")
    .maybeSingle();

  return {
    id: user.id,
    fullName: created?.full_name ?? seedName,
    phone: created?.phone ?? null,
    email: user.email ?? null,
  };
}
