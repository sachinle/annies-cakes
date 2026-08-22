import "server-only";
import QRCode from "qrcode";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/site-config";

// UPI payment links.
//
// The UPI ID is read live from Leo Billing's business_profiles row, so
// changing it in the Profile screen changes what the website offers —
// nothing here is hardcoded.
//
// Only `upi_id` and the shop name are ever selected. business_profiles
// also holds bank_name / account_no / ifsc_code, and none of that has
// any business being anywhere near a customer-facing page.
//
// Worth being clear about the limits: this is a deep link, not a
// payment gateway. It opens the customer's UPI app with the amount
// pre-filled, but no confirmation comes back to this site. The order is
// only actually settled when the owner marks the invoice paid in Leo
// Billing.

export type UpiDetails = {
  vpa: string;
  payeeName: string;
};

type UpiAccount = { label?: string; vpa?: string; enabled?: boolean };

type ProfileRow = {
  upi_id: string | null;
  shop_name: string | null;
  upi_accounts?: UpiAccount[] | null;
};

/** Reads the owner's UPI ID. Returns null if none is configured. */
export async function getUpiDetails(): Promise<UpiDetails | null> {
  // Deliberately its own variable, NOT the first entry of
  // OWNER_FIREBASE_UIDS. That list holds every UID allowed to
  // administer the site, and this Supabase project is shared with
  // other businesses — picking one by position would happily hand a
  // customer another shop's UPI ID and send them to pay the wrong
  // person. This must name one profile, explicitly.
  const businessUid = process.env.BUSINESS_PROFILE_UID?.trim();
  if (!businessUid) return null;

  const db = getSupabaseAdmin();

  // upi_accounts arrives with migration 0014. Selecting a column that
  // doesn't exist is an error, not a null, so the query falls back to
  // the original single field — the site keeps working whether or not
  // the migration has been run yet.
  let data: ProfileRow | null = null;

  const withList = await db
    .from("business_profiles")
    .select("upi_id, shop_name, upi_accounts")
    .eq("user_id", businessUid)
    .maybeSingle();

  if (withList.error) {
    const legacy = await db
      .from("business_profiles")
      .select("upi_id, shop_name")
      .eq("user_id", businessUid)
      .maybeSingle();

    if (legacy.error) {
      console.error("[getUpiDetails]", legacy.error);
      return null;
    }
    data = legacy.data as ProfileRow | null;
  } else {
    data = withList.data as ProfileRow | null;
  }

  // First enabled account in the list wins; `upi_id` is the fallback for
  // a profile that predates the list.
  const fromList = (Array.isArray(data?.upi_accounts) ? data.upi_accounts : [])
    .find((a) => a && a.enabled !== false && String(a.vpa ?? "").trim());

  const vpa = String(fromList?.vpa ?? data?.upi_id ?? "").trim();
  // A UPI ID is name@handle. Anything else would produce a link that
  // fails inside the payment app with a confusing error, so treat it
  // as not configured and hide the button instead.
  if (!/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/.test(vpa)) return null;

  return {
    vpa,
    payeeName: String(data?.shop_name || siteConfig.name).trim(),
  };
}

/**
 * Build a UPI deep link.
 *
 * Amount always comes from the invoice on the server. It is never taken
 * from the browser — a customer editing the number in a URL must not be
 * able to decide what they owe.
 */
export function buildUpiUri({
  vpa,
  payeeName,
  amount,
  note,
  ref,
}: {
  vpa: string;
  payeeName: string;
  amount: number;
  note?: string;
  ref?: string;
}): string {
  const params = new URLSearchParams({
    pa: vpa,
    pn: payeeName,
    // UPI expects a plain decimal with two places. Locale formatting
    // here (₹, thousands separators) makes apps reject the link.
    am: amount.toFixed(2),
    cu: "INR",
  });

  if (note) params.set("tn", note.slice(0, 50));
  // `tr` must be alphanumeric; anything else is silently dropped by
  // some apps and rejected outright by others.
  if (ref) params.set("tr", ref.replace(/[^a-zA-Z0-9]/g, "").slice(0, 35));

  return `upi://pay?${params.toString()}`;
}

/**
 * QR for the same link, rendered server-side.
 *
 * Kept on the server so the qrcode library never ships to the browser.
 * Error correction M survives a phone camera at an angle without
 * making the code so dense it stops scanning on a small screen.
 */
export async function upiQrSvg(uri: string): Promise<string | null> {
  try {
    return await QRCode.toString(uri, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 1,
      color: { dark: "#5f4d40", light: "#ffffff" },
    });
  } catch (err) {
    console.error("[upiQrSvg]", err);
    return null;
  }
}
