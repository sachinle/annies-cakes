-- ============================================================
-- Website publishing controls + slug backfill
--
-- Safe to run. Only touches columns created by 0001 (today, read by
-- no existing code) and adds one new column. Leo Billing's own
-- columns — name, price, unit, stock, category, gst_rate — are not
-- modified, so nothing in the billing app changes behaviour.
--
-- WHY THIS EXISTS
-- The products table is a *billing* catalogue, not a storefront. Of
-- the 58 rows currently in it, many should never appear on a public
-- cake website: "Delivery Charge", "Photo Card Topper", "Papaya",
-- "Water Melon", "Tomato Rice", "Lemon Rice", "Veg biryani",
-- "Pani Puri Water", "Potato Mix", "Lemon Juice", "Rose Milk", and a
-- test row literally named "sachin".
--
-- 0001 gave the publish flag a default of `true`, which would have
-- published all 58 the moment the site went live. That was the wrong
-- default — it was chosen before the real data had been inspected.
-- This migration flips it: nothing is public until it is explicitly
-- opted in from Leo Billing.
-- ============================================================

begin;

-- ── 1. Rename is_active → is_published ─────────────────────────
-- `is_active` reads like "sold in the shop"; this flag means
-- "visible on the public website". Renaming now is free: the column
-- was created today by 0001 and is read by zero lines of code.
alter table products rename column is_active to is_published;

alter table products alter column is_published set default false;

-- Nothing is public until the owner opts it in, one cake at a time.
update products set is_published = false;

comment on column products.is_published is
  'Show this product on the public website. Owner-controlled from Leo Billing. Default false.';

-- ── 2. Website-only category ───────────────────────────────────
-- Leo Billing's existing `category` column keeps its current values
-- ("Food & Beverage", null) and its existing filter UI. The website
-- needs cake-shaped categories, so it gets its own column rather
-- than overwriting billing data.
alter table products
  add column if not exists website_category text;

comment on column products.website_category is
  'Storefront category (e.g. Ice Cakes, Bento Cakes, Brownies). Separate from billing `category`.';

-- ── 3. Backfill slugs from product names ───────────────────────
-- Stable, SEO-friendly URLs: /cakes/black-forest-ice-cake
-- Collisions get a numeric suffix. Only fills rows where slug is null,
-- so re-running this is harmless and never rewrites a slug that has
-- already been published (changing a live slug would break its URL).
with slugged as (
  select
    id,
    trim(both '-' from
      regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')
    ) as base
  from products
  where slug is null
    and name is not null
    and trim(name) <> ''
),
numbered as (
  select id, base, row_number() over (partition by base order by id) as rn
  from slugged
  where base <> ''
)
update products p
set slug = case when n.rn = 1 then n.base else n.base || '-' || n.rn::text end
from numbered n
where p.id = n.id;

commit;

-- ── Verify ──────────────────────────────────────────────────────
-- Expect: every product has a slug, and is_published is false for all.
-- select id, name, slug, is_published, website_category
-- from products order by name;
