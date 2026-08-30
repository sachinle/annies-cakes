// Geometry for delivery zones.
//
// Deliberately dependency-free and pure: no imports, no I/O, no
// `server-only`. That lets the same functions run on the server (where
// the authoritative check happens) and, if ever needed, in the browser
// for instant feedback — with zero risk of the two disagreeing.

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6_371_008.8; // IUGG mean radius
const toRad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Great-circle distance in metres between two points.
 *
 * Haversine rather than the simpler equirectangular approximation: at
 * the few-kilometre scale a delivery radius actually uses, the error
 * from flattening the earth is metres, but haversine costs nothing and
 * removes the question entirely. It is also numerically stable for very
 * small distances, which the naive spherical law-of-cosines is not.
 */
export function distanceMetres(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Is a point inside a polygon?
 *
 * Ray casting: count how many edges a ray from the point crosses. Odd
 * means inside. The ring is treated as closed, so the caller must not
 * repeat the first point.
 *
 * Longitude is used as x and latitude as y. Over a delivery-sized area
 * that planar treatment is accurate to well under a metre, and it
 * avoids the spherical-polygon machinery this does not need.
 *
 * Known limitation, stated rather than hidden: this does not handle a
 * polygon crossing the ±180° antimeridian. A delivery zone that spans
 * the Pacific is not a real case here, and pretending to handle it
 * would add untested code.
 */
export function isInsidePolygon(point: LatLng, ring: LatLng[]): boolean {
  if (ring.length < 3) return false;

  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i].lng;
    const yi = ring[i].lat;
    const xj = ring[j].lng;
    const yj = ring[j].lat;

    // Does the edge straddle the point's latitude, and if so, is the
    // crossing to the right of the point?
    const straddles = yi > point.lat !== yj > point.lat;
    if (!straddles) continue;

    const xCross = ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (point.lng < xCross) inside = !inside;
  }

  return inside;
}

/** Parses the stored `[[lat, lng], ...]` shape, dropping anything malformed. */
export function parsePolygon(raw: unknown): LatLng[] {
  if (!Array.isArray(raw)) return [];

  const points: LatLng[] = [];
  for (const entry of raw) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const lat = Number(entry[0]);
    const lng = Number(entry[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
    points.push({ lat, lng });
  }
  return points;
}

/** True when the value is a usable coordinate. */
export function isValidLatLng(lat: unknown, lng: unknown): boolean {
  const a = Number(lat);
  const b = Number(lng);
  return (
    Number.isFinite(a) &&
    Number.isFinite(b) &&
    a >= -90 &&
    a <= 90 &&
    b >= -180 &&
    b <= 180 &&
    // 0,0 is in the Atlantic and is what a broken GPS reading looks
    // like far more often than a real customer.
    !(a === 0 && b === 0)
  );
}

export function formatDistance(metres: number): string {
  if (metres < 950) return `${Math.round(metres / 10) * 10} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}
