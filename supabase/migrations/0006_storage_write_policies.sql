-- ============================================================
-- Storage write policies for product photos
--
-- Fixes: "new row violates row-level security policy" when uploading a
-- product photo from Leo Billing.
--
-- Cause: 0005 created the bucket with a public READ policy but granted
-- no WRITE permission to anyone, on the assumption Leo Billing would
-- already be presenting a verified identity. It wasn't, so every upload
-- was correctly rejected.
--
-- ── Run order ───────────────────────────────────────────────────
--   1. Supabase Dashboard → Authentication → Sign In / Providers →
--      Third Party Auth → Add provider → Firebase
--      Firebase Project ID: leo-billing
--
--   2. Pull the updated src/services/supabase.js (already patched) and
--      restart the Leo Billing dev server so the accessToken callback
--      is live.
--
--   3. Run this file.
--
--   4. Reload Leo Billing and upload a photo.
--
-- Steps 1 and 2 cannot break existing access. The policies currently on
-- business_profiles / customers / products / invoices / invoice_items do
-- not inspect the caller's identity at all — they compare `user_id`
-- against a fixed array of UIDs. Supplying an identity does not make
-- those checks stricter, so every existing query keeps working exactly
-- as it does today. (This is what makes it different from 0002, which
-- changed the policies themselves and caused an outage.)
--
-- If step 4 still fails, the ID token isn't reaching Postgres — check
-- that the Firebase provider in step 1 saved with project id
-- `leo-billing`, and that the dev server was restarted. Do not work
-- around it by granting write access to `anon`: this bucket is public,
-- and an open write policy lets anyone on the internet fill your
-- storage quota with the anon key that ships in the app bundle.
-- ============================================================

begin;

-- The three owner accounts that use Leo Billing. Same UIDs already
-- present in the existing table policies.
drop policy if exists "owner uploads product images" on storage.objects;
create policy "owner uploads product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and (auth.jwt() ->> 'sub') = ANY (ARRAY[
      'T0miXjt8w6byGIKpO8g6ZBiUOhl2',
      'f7qgUXdOXpRUDtiYUIzgoXGTfe63',
      'HsVFQiNFAnZx5ZvJFuLMRleZHSG3'
    ])
  );

-- Needed when a photo is replaced.
drop policy if exists "owner updates product images" on storage.objects;
create policy "owner updates product images"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and (auth.jwt() ->> 'sub') = ANY (ARRAY[
      'T0miXjt8w6byGIKpO8g6ZBiUOhl2',
      'f7qgUXdOXpRUDtiYUIzgoXGTfe63',
      'HsVFQiNFAnZx5ZvJFuLMRleZHSG3'
    ])
  );

-- Needed so replacing a photo cleans up the old file instead of
-- leaving orphans that slowly eat the 1 GB free tier.
drop policy if exists "owner deletes product images" on storage.objects;
create policy "owner deletes product images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and (auth.jwt() ->> 'sub') = ANY (ARRAY[
      'T0miXjt8w6byGIKpO8g6ZBiUOhl2',
      'f7qgUXdOXpRUDtiYUIzgoXGTfe63',
      'HsVFQiNFAnZx5ZvJFuLMRleZHSG3'
    ])
  );

commit;

-- ── Verify ──────────────────────────────────────────────────────
-- select policyname, cmd from pg_policies
-- where schemaname = 'storage' and tablename = 'objects'
-- order by policyname;
