-- ============================================================
-- 0015 — Saved delivery address on the customer profile
--
-- Lets a customer store their address once and have checkout fill it in
-- for them, instead of retyping it on every order.
--
-- Mirrors the columns already on `orders`, so prefilling is a direct
-- copy with no mapping and no chance of the two drifting apart.
--
-- SAFE TO RUN ON PRODUCTION: additive only. Every column is nullable
-- with no default, so existing rows are untouched and nothing that
-- reads this table today can break.
-- ============================================================

alter table website_customers
  add column if not exists address   text,
  add column if not exists landmark  text,
  add column if not exists city      text,
  add column if not exists pincode   text,
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;

comment on column website_customers.address is
  'Saved delivery address, used to prefill checkout. Mirrors orders.address.';

-- RLS already covers this table: a customer can only read and write
-- their own row (id = auth.uid()), which is exactly the boundary this
-- data needs. No new policy required — verify with:
--
--   select polname, cmd, qual
--   from pg_policies where tablename = 'website_customers';

-- ── Verify ──────────────────────────────────────────────────
-- select column_name, data_type, is_nullable
-- from information_schema.columns
-- where table_name = 'website_customers'
-- order by ordinal_position;
