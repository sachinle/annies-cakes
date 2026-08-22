"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server-auth";

export type ProfileState = { error?: string; message?: string };

const PHONE_RE = /^[+]?[\d\s-]{7,20}$/;

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  // Saved delivery address. Entirely optional — someone who only ever
  // collects from the kitchen should never be nagged for one.
  const address = String(formData.get("address") ?? "").trim().slice(0, 300);
  const landmark = String(formData.get("landmark") ?? "").trim().slice(0, 120);
  const city = String(formData.get("city") ?? "").trim().slice(0, 80);
  const pincode = String(formData.get("pincode") ?? "").trim().slice(0, 10);

  if (fullName.length < 2 || fullName.length > 100) {
    return { error: "Please enter your name." };
  }
  if (phone && !PHONE_RE.test(phone)) {
    return { error: "Please enter a valid phone number." };
  }
  if (pincode && !/^\d{6}$/.test(pincode)) {
    return { error: "An Indian pincode is 6 digits." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  // Identity comes from the verified session, never from the form —
  // a client-supplied id would let anyone edit someone else's profile.
  // RLS enforces the same rule independently.
  const base = {
    full_name: fullName,
    phone: phone || null,
    updated_at: new Date().toISOString(),
  };

  // The address columns arrive with migration 0015. If it hasn't been
  // run, saving the name and phone must still work rather than failing
  // the whole form on a column that isn't there yet.
  let { error } = await supabase
    .from("website_customers")
    .update({
      ...base,
      address: address || null,
      landmark: landmark || null,
      city: city || null,
      pincode: pincode || null,
    })
    .eq("id", user.id);

  if (error) {
    const retry = await supabase
      .from("website_customers")
      .update(base)
      .eq("id", user.id);
    error = retry.error;
  }

  if (error) return { error: "We couldn't save that. Please try again." };

  revalidatePath("/account");
  return { message: "Saved." };
}
