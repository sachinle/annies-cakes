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
  // Saved delivery address (migration 0015). Used to prefill checkout
  // so a returning customer doesn't retype it on every order.
  address: string | null;
  landmark: string | null;
  city: string | null;
  pincode: string | null;
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

  // Address columns arrive with migration 0015. Selecting a column
  // that doesn't exist is an error rather than a null, so this falls
  // back to the original shape and the profile keeps working either
  // way.
  let existing: Record<string, unknown> | null = null;

  const full = await supabase
    .from("website_customers")
    .select("id, full_name, phone, address, landmark, city, pincode")
    .eq("id", user.id)
    .maybeSingle();

  if (full.error) {
    const legacy = await supabase
      .from("website_customers")
      .select("id, full_name, phone")
      .eq("id", user.id)
      .maybeSingle();
    existing = legacy.data;
  } else {
    existing = full.data;
  }

  if (existing) {
    return {
      id: String(existing.id),
      fullName: (existing.full_name as string) ?? null,
      phone: (existing.phone as string) ?? null,
      email: user.email ?? null,
      address: (existing.address as string) ?? null,
      landmark: (existing.landmark as string) ?? null,
      city: (existing.city as string) ?? null,
      pincode: (existing.pincode as string) ?? null,
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
    address: null,
    landmark: null,
    city: null,
    pincode: null,
  };
}
