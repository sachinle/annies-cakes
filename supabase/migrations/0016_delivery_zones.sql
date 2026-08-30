-- ============================================================
-- 0016 — Map-based delivery zones
--
-- Replaces "is your pincode on the list?" with "are you actually inside
-- the area we deliver to?".
--
-- A pincode is a postal sorting code, not a delivery boundary. 641032
-- covers several square kilometres; half of it can be a ten-minute ride
-- and the other half not worth the trip. A radius drawn from the shop,
-- or a polygon traced around the streets actually covered, is the real
-- boundary — and the customer's phone can answer it exactly.
--
-- Two shapes are supported:
--   circle  — centre point + radius in metres (the common case:
--             "anywhere within 5km of the shop")
--   polygon — an ordered ring of [lat, lng] points, for when the real
--             boundary follows a road or a river rather than a circle
--
-- service_pincodes is deliberately LEFT IN PLACE and untouched. The
-- website falls back to it when no zone is configured, so running this
-- migration changes nothing until the first zone is drawn. That keeps
-- the switch-over reversible.
--
-- SAFE TO RUN ON PRODUCTION: creates one new table. Nothing existing is
-- altered, renamed or dropped.
-- ============================================================

create table if not exists delivery_zones (
  id           bigint generated always as identity primary key,

  name         text not null,
  shape        text not null check (shape in ('circle', 'polygon')),

  -- Circle. The shop pin doubles as the map's default centre.
  center_lat   double precision,
  center_lng   double precision,
  radius_m     integer,

  -- Polygon: [[lat, lng], [lat, lng], ...] in order, ring implicitly
  -- closed. Stored as jsonb rather than PostGIS geometry so this needs
  -- no extension enabled on the project.
  polygon      jsonb,

  delivery_fee numeric(10,2) not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- A circle without a centre and radius, or a polygon without points,
  -- is a zone that can never match. Rejecting it here means the
  -- website never has to defend against a half-saved shape.
  constraint delivery_zones_shape_complete check (
    (shape = 'circle'
      and center_lat is not null
      and center_lng is not null
      and radius_m is not null
      and radius_m > 0)
    or
    (shape = 'polygon'
      and polygon is not null
      and jsonb_typeof(polygon) = 'array'
      and jsonb_array_length(polygon) >= 3)
  ),

  -- Latitude and longitude have hard real-world limits; a typo that
  -- puts the shop at lat 910 should fail loudly, not silently match
  -- nobody.
  constraint delivery_zones_latlng_valid check (
    center_lat is null or (center_lat between -90 and 90)
  ),
  constraint delivery_zones_lng_valid check (
    center_lng is null or (center_lng between -180 and 180)
  )
);

comment on table delivery_zones is
  'Areas the business delivers to, drawn on a map in Leo Billing (Website -> Delivery Areas). The website tests the customer''s GPS position against these. Falls back to service_pincodes when empty.';
comment on column delivery_zones.radius_m is
  'Circle radius in METRES. Stored in metres, not km, so no rounding is needed at the boundary.';
comment on column delivery_zones.polygon is
  'Ordered [[lat, lng], ...] ring. Closed implicitly - do not repeat the first point.';

create index if not exists delivery_zones_active_idx
  on delivery_zones (is_active);

-- ── RLS ─────────────────────────────────────────────────────
-- Same posture as the other website tables: enabled, with NO anon
-- policy. The storefront reads these through the service role inside a
-- server action, and Leo Billing writes them through /api/admin/cms.
-- Nothing reaches this table with the public key.
alter table delivery_zones enable row level security;

-- ── Verify ──────────────────────────────────────────────────
-- select id, name, shape, center_lat, center_lng, radius_m,
--        jsonb_array_length(coalesce(polygon, '[]'::jsonb)) as points,
--        is_active
-- from delivery_zones order by id;
--
-- Confirm RLS is on and no policy exposes it:
-- select relrowsecurity from pg_class where relname = 'delivery_zones';
-- select polname from pg_policies where tablename = 'delivery_zones';
