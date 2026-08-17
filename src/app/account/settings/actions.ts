"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export type DeleteState = { error?: string };

export async function deleteAccount(
  _prev: DeleteState,
  formData: FormData
): Promise<DeleteState> {
  // Typed confirmation — deletion is irreversible, so it shouldn't be
  // reachable by a single stray click.
  const confirmation = String(formData.get("confirm") ?? "").trim();
  if (confirmation !== "DELETE") {
    return { error: 'Type DELETE to confirm.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The id comes from the verified session only. If this were taken
  // from the form, anyone could delete any account.
  if (!user) return { error: "Please sign in again." };

  // Deleting an auth user requires admin privileges, so this step runs
  // with the service role. It is scoped to exactly the id we just
  // verified — never a value supplied by the browser.
  const { error } = await getSupabaseAdmin().auth.admin.deleteUser(user.id);

  if (error) {
    console.error("[account] delete failed:", error);
    return { error: "We couldn't delete your account. Please contact us." };
  }

  // website_customers cascades from auth.users; orders are retained
  // with customer_id set to null (see migration 0007).
  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
