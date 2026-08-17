"use server";

import { checkPincode, type PincodeResult } from "@/lib/delivery";

/**
 * Serviceability check for the order form.
 *
 * A Server Action rather than a public API route: it's only reachable
 * from our own form, and it returns a single yes/no rather than
 * anything that could be scraped into a list of the areas we cover.
 */
export async function checkDeliveryPincode(
  pincode: string
): Promise<PincodeResult> {
  return checkPincode(pincode);
}
