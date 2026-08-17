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

  if (fullName.length < 2 || fullName.length > 100) {
    return { error: "Please enter your name." };
  }
  if (phone && !PHONE_RE.test(phone)) {
    return { error: "Please enter a valid phone number." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in again." };

  // Identity comes from the verified session, never from the form —
  // a client-supplied id would let anyone edit someone else's profile.
  // RLS enforces the same rule independently.
  const { error } = await supabase
    .from("website_customers")
    .update({
      full_name: fullName,
      phone: phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: "We couldn't save that. Please try again." };

  revalidatePath("/account");
  return { message: "Saved." };
}
