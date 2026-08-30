"use server";

import { checkLocation, zonesConfigured, type LocationResult } from "@/lib/delivery";

/**
 * Serviceability check from the customer's GPS position.
 *
 * A Server Action rather than a public API route: it is only reachable
 * from our own form, and it answers one question about one point. It
 * never returns the zones themselves, so nobody can walk the endpoint
 * to reconstruct a map of where the business delivers.
 *
 * The verdict is decided HERE, not in the browser. A customer can spoof
 * their coordinates — that is unavoidable with any GPS check, and it
 * amounts to claiming to be somewhere they are not — but they cannot
 * make an out-of-range point return "serviceable", and the same check
 * runs again when the order is actually submitted.
 */
export async function checkDeliveryLocation(
  lat: number,
  lng: number
): Promise<LocationResult> {
  return checkLocation(lat, lng);
}

/**
 * Whether the order form should offer the map check at all.
 *
 * False until the owner draws their first zone, at which point the form
 * switches from asking for a pincode to asking for a position.
 */
export async function useMapZones(): Promise<boolean> {
  return zonesConfigured();
}
