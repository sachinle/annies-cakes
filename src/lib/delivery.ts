import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";

// Delivery serviceability by pincode.
//
// Read with the service role and reduced to a yes/no plus the area
// name. The full list of areas the business covers is not exposed —
// a customer only needs an answer about their own pincode.

export type PincodeResult = {
  serviceable: boolean;
  areaName: string | null;
  deliveryFee: number;
};

export async function checkPincode(pincode: string): Promise<PincodeResult> {
  const clean = pincode.replace(/\D/g, "");
  if (!/^\d{6}$/.test(clean)) {
    return { serviceable: false, areaName: null, deliveryFee: 0 };
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from("service_pincodes")
      .select("area_name, delivery_fee, is_active")
      .eq("pincode", clean)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) {
      return { serviceable: false, areaName: null, deliveryFee: 0 };
    }

    return {
      serviceable: true,
      areaName: data.area_name,
      deliveryFee: Number(data.delivery_fee ?? 0),
    };
  } catch {
    // If the check itself fails we say "not serviceable" rather than
    // guessing yes — promising a delivery we can't make is worse than
    // asking the customer to collect.
    return { serviceable: false, areaName: null, deliveryFee: 0 };
  }
}

/** True when at least one area is configured — otherwise hide delivery entirely. */
export async function deliveryAvailableAnywhere(): Promise<boolean> {
  try {
    const { count } = await getSupabaseAdmin()
      .from("service_pincodes")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);
    return (count ?? 0) > 0;
  } catch {
    return false;
  }
}
