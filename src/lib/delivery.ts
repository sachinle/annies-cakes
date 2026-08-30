import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  distanceMetres,
  formatDistance,
  isInsidePolygon,
  isValidLatLng,
  parsePolygon,
  type LatLng,
} from "@/lib/geo";

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

// ── Map-based zones (migration 0016) ────────────────────────
//
// A pincode is a postal sorting code, not a delivery boundary — 641032
// covers several square kilometres, and half of it can be a ten-minute
// ride while the rest is not worth the trip. A radius drawn from the
// shop, or a polygon traced around the streets actually covered, is the
// real answer, and a phone can settle it exactly.
//
// This check runs server-side ON PURPOSE. The browser supplies raw
// coordinates and nothing else; it never decides the outcome. Someone
// editing their position in devtools can only move the pin — which is
// the same as walking somewhere — they cannot flip the verdict.

export type LocationResult = {
  serviceable: boolean;
  zoneName: string | null;
  deliveryFee: number;
  /** Distance to the nearest circle centre, so a refusal can say "you
   *  are 7.2 km away" instead of just no. Null when only polygons. */
  distanceText: string | null;
};

type ZoneRow = {
  name: string;
  shape: string;
  center_lat: number | null;
  center_lng: number | null;
  radius_m: number | null;
  polygon: unknown;
  delivery_fee: number | null;
};

const DENY: LocationResult = {
  serviceable: false,
  zoneName: null,
  deliveryFee: 0,
  distanceText: null,
};

/** Are any map zones configured? Decides whether zones are used at all. */
export async function zonesConfigured(): Promise<boolean> {
  try {
    const { count } = await getSupabaseAdmin()
      .from("delivery_zones")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);
    return (count ?? 0) > 0;
  } catch {
    // The table does not exist until 0016 is run. Treat that as "no
    // zones" so the site keeps working on the pincode path untouched.
    return false;
  }
}

/**
 * Is this position inside any active delivery zone?
 *
 * Every zone is tested and the cheapest match wins, so overlapping
 * zones behave predictably instead of depending on row order.
 */
export async function checkLocation(
  lat: unknown,
  lng: unknown
): Promise<LocationResult> {
  if (!isValidLatLng(lat, lng)) return DENY;
  const point: LatLng = { lat: Number(lat), lng: Number(lng) };

  let rows: ZoneRow[] = [];
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("delivery_zones")
      .select("name, shape, center_lat, center_lng, radius_m, polygon, delivery_fee")
      .eq("is_active", true);
    if (error || !data) return DENY;
    rows = data as ZoneRow[];
  } catch {
    return DENY;
  }

  let best: LocationResult | null = null;
  let nearestMetres = Infinity;

  for (const z of rows) {
    const fee = Number(z.delivery_fee ?? 0);

    if (z.shape === "circle") {
      if (z.center_lat == null || z.center_lng == null || !z.radius_m) continue;

      const d = distanceMetres(point, { lat: z.center_lat, lng: z.center_lng });
      // Track the nearest centre even on a miss, so a refusal can be
      // specific rather than blank.
      if (d < nearestMetres) nearestMetres = d;

      if (d <= z.radius_m && (!best || fee < best.deliveryFee)) {
        best = {
          serviceable: true,
          zoneName: z.name,
          deliveryFee: fee,
          distanceText: formatDistance(d),
        };
      }
    } else if (z.shape === "polygon") {
      const ring = parsePolygon(z.polygon);
      if (ring.length < 3) continue;

      if (isInsidePolygon(point, ring) && (!best || fee < best.deliveryFee)) {
        best = {
          serviceable: true,
          zoneName: z.name,
          deliveryFee: fee,
          distanceText: null,
        };
      }
    }
  }

  if (best) return best;

  return {
    ...DENY,
    distanceText: Number.isFinite(nearestMetres)
      ? formatDistance(nearestMetres)
      : null,
  };
}

/**
 * The single question the order flow should ask.
 *
 * Prefers map zones when any exist, falling back to pincodes otherwise —
 * so running migration 0016 changes nothing until the first zone is
 * actually drawn.
 */
export async function deliveryAvailable(): Promise<boolean> {
  return (await zonesConfigured()) || (await deliveryAvailableAnywhere());
}
