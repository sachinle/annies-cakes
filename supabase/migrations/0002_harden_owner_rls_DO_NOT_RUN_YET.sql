-- ============================================================
-- ⚠️  DO NOT RUN THIS FILE YET.
--
-- An earlier version of this file was run on 2026-08-09 and caused a
-- live outage: Leo Billing showed zero invoices, customers, and
-- products until the old policies were restored. No data was lost —
-- the rows were simply hidden from a caller the database could not
-- identify. Two separate mistakes caused that, and BOTH are fixed
-- below. Read the whole header before running anything here.
--
-- ── Mistake 1: sequencing ───────────────────────────────────────
-- The policies were switched to identity-based checks before Leo
-- Billing had any way to prove its identity to Supabase. Leo Billing
-- logs in with Firebase and talks to Supabase with only the public
-- anon key, so from Postgres's point of view every request was
-- anonymous. The policies worked exactly as written and correctly
-- hid everything.
--
-- ── Mistake 2: wrong function ───────────────────────────────────
-- The earlier version used `auth.uid()::text`. That is wrong for
-- Firebase regardless of configuration. `auth.uid()` is defined as
-- the JWT's `sub` claim cast to `uuid`. Firebase UIDs are not UUIDs
-- (yours look like 'T0miXjt8w6byGIKpO8g6ZBiUOhl2'), so that cast
-- fails. The correct expression for a third-party Firebase JWT is
-- `auth.jwt() ->> 'sub'`, which reads the claim as text with no cast.
-- Every policy below now uses that form.
--
-- ── Why this change is still worth making ───────────────────────
-- The policies currently in production check a hardcoded array of 3
-- Firebase UIDs, with role `public`, and never check who is asking.
-- Since every row already belongs to one of those UIDs, every row
-- matches for every caller — including a completely anonymous request
-- carrying only the anon key, which is visible in the deployed app's
-- JS bundle (that part is normal for Supabase; the missing identity
-- check is not). Today that means anyone can read or write
-- business_profiles (including bank_name, account_no, ifsc_code,
-- upi_id), customers (names, phones, addresses), products, invoices,
-- and invoice_items by calling the REST API directly. The Firebase
-- login screen only guards the React UI, not the database.
--
-- ── Required order — do not skip or reorder ─────────────────────
--   1. Supabase Dashboard → Authentication → Sign In / Providers →
--      Third Party Auth → Add provider → Firebase.
--      Firebase Project ID: leo-billing
--
--   2. Apply the `accessToken` patch to Leo Billing's
--      src/services/supabase.js so every Supabase request carries the
--      signed-in user's Firebase ID token. Deploy/run that build.
--
--   3. Verify while signed in to Leo Billing that Dashboard,
--      Customers, Products, and Invoices all still show real data.
--      If anything is empty, STOP — do not run this file.
--
--   4. Run the verification query at the bottom of this file. It must
--      return your Firebase UID, not null. If it returns null, the
--      token is not reaching Postgres; stop and fix that first.
--
--   5. Only then run the migration block below.
--
--   6. Immediately reload Leo Billing and confirm data is still
--      visible. If it is not, run the rollback block at the bottom.
--
-- Have the rollback block open in a second SQL editor tab before you
-- run step 5, so recovery is one click and not a scramble.
-- ============================================================


-- ── STEP 4: verification. Run this ALONE, first. ────────────────
-- Run this from the Leo Billing app (not the SQL editor — the SQL
-- editor runs as the `postgres` role and has no Firebase JWT, so it
-- will always return null here and tells you nothing).
--
-- Temporarily add this to a Leo Billing page to check:
--   const { data } = await supabase.rpc('debug_whoami');
--   console.log('jwt sub =', data);
--
-- create or replace function debug_whoami() returns text
--   language sql stable as $$ select auth.jwt() ->> 'sub' $$;
--
-- Expected: your Firebase UID, e.g. 'T0miXjt8w6byGIKpO8g6ZBiUOhl2'
-- If null → the ID token is not reaching Supabase. Do not proceed.
-- Remember to drop the function afterwards:
--   drop function if exists debug_whoami;


-- ── STEP 5: the migration ───────────────────────────────────────
/*  Uncomment this block only after steps 1-4 all pass.

begin;

drop policy if exists "Profile Access" on business_profiles;
create policy "Profile Access" on business_profiles
  for all
  using       (user_id = auth.jwt() ->> 'sub')
  with check  (user_id = auth.jwt() ->> 'sub');

drop policy if exists "Customer Access" on customers;
create policy "Customer Access" on customers
  for all
  using       (user_id = auth.jwt() ->> 'sub')
  with check  (user_id = auth.jwt() ->> 'sub');

drop policy if exists "Invoice Items" on invoice_items;
create policy "Invoice Items" on invoice_items
  for all
  using       (user_id = auth.jwt() ->> 'sub')
  with check  (user_id = auth.jwt() ->> 'sub');

drop policy if exists "Invoices Access" on invoices;
create policy "Invoices Access" on invoices
  for all
  using       (user_id = auth.jwt() ->> 'sub')
  with check  (user_id = auth.jwt() ->> 'sub');

drop policy if exists "Product Access" on products;
create policy "Product Access" on products
  for all
  using       (user_id = auth.jwt() ->> 'sub')
  with check  (user_id = auth.jwt() ->> 'sub');

commit;

*/


-- ── STEP 6 (if needed): ROLLBACK ────────────────────────────────
-- Restores the exact policies that are in production right now.
-- Safe to run at any time; brings the app straight back to working.
/*
begin;

drop policy if exists "Profile Access" on business_profiles;
create policy "Profile Access" on business_profiles for all
  using      (user_id = ANY (ARRAY['T0miXjt8w6byGIKpO8g6ZBiUOhl2','f7qgUXdOXpRUDtiYUIzgoXGTfe63','HsVFQiNFAnZx5ZvJFuLMRleZHSG3']))
  with check (user_id = ANY (ARRAY['T0miXjt8w6byGIKpO8g6ZBiUOhl2','f7qgUXdOXpRUDtiYUIzgoXGTfe63','HsVFQiNFAnZx5ZvJFuLMRleZHSG3']));

drop policy if exists "Customer Access" on customers;
create policy "Customer Access" on customers for all
  using      (user_id = ANY (ARRAY['T0miXjt8w6byGIKpO8g6ZBiUOhl2','f7qgUXdOXpRUDtiYUIzgoXGTfe63','HsVFQiNFAnZx5ZvJFuLMRleZHSG3']))
  with check (user_id = ANY (ARRAY['T0miXjt8w6byGIKpO8g6ZBiUOhl2','f7qgUXdOXpRUDtiYUIzgoXGTfe63','HsVFQiNFAnZx5ZvJFuLMRleZHSG3']));

drop policy if exists "Invoice Items" on invoice_items;
create policy "Invoice Items" on invoice_items for all
  using      (user_id = ANY (ARRAY['T0miXjt8w6byGIKpO8g6ZBiUOhl2','f7qgUXdOXpRUDtiYUIzgoXGTfe63','HsVFQiNFAnZx5ZvJFuLMRleZHSG3']))
  with check (user_id = ANY (ARRAY['T0miXjt8w6byGIKpO8g6ZBiUOhl2','f7qgUXdOXpRUDtiYUIzgoXGTfe63','HsVFQiNFAnZx5ZvJFuLMRleZHSG3']));

drop policy if exists "Invoices Access" on invoices;
create policy "Invoices Access" on invoices for all
  using      (user_id = ANY (ARRAY['T0miXjt8w6byGIKpO8g6ZBiUOhl2','f7qgUXdOXpRUDtiYUIzgoXGTfe63','HsVFQiNFAnZx5ZvJFuLMRleZHSG3']))
  with check (user_id = ANY (ARRAY['T0miXjt8w6byGIKpO8g6ZBiUOhl2','f7qgUXdOXpRUDtiYUIzgoXGTfe63','HsVFQiNFAnZx5ZvJFuLMRleZHSG3']));

drop policy if exists "Product Access" on products;
create policy "Product Access" on products for all
  using      (user_id = ANY (ARRAY['T0miXjt8w6byGIKpO8g6ZBiUOhl2','f7qgUXdOXpRUDtiYUIzgoXGTfe63','HsVFQiNFAnZx5ZvJFuLMRleZHSG3']))
  with check (user_id = ANY (ARRAY['T0miXjt8w6byGIKpO8g6ZBiUOhl2','f7qgUXdOXpRUDtiYUIzgoXGTfe63','HsVFQiNFAnZx5ZvJFuLMRleZHSG3']));

commit;
*/
