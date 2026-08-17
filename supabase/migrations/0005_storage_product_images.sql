-- ============================================================
-- Supabase Storage bucket for product photos
--
-- One image per product, compressed to WebP in the browser before
-- upload (see Leo Billing src/utils/imageCompress.js). Typical cake
-- photo lands around 150-300 KB at 1600px wide, so the whole
-- catalogue sits comfortably inside the free tier's 1 GB.
--
-- The bucket is PUBLIC-READ on purpose: these are marketing photos
-- meant to be seen by anyone, and public URLs let next/image and the
-- CDN cache them without signing every request. Nothing private is
-- ever placed in this bucket.
--
-- WRITES are restricted — see the policies below.
-- ============================================================

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB hard ceiling; compression should land far under this
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone may read product photos (they appear on the public website).
drop policy if exists "product images are publicly readable" on storage.objects;
create policy "product images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Uploads/updates/deletes are NOT granted to the anon role here.
-- Leo Billing performs them, and it will be able to once it presents a
-- verified Firebase identity (see 0002). Until then the owner's uploads
-- go through the service role. Deliberately no permissive write policy:
-- an open write policy on a public bucket lets anyone fill your storage
-- quota or replace your cake photos.

commit;

-- ── Verify ──────────────────────────────────────────────────────
-- select id, public, file_size_limit, allowed_mime_types
-- from storage.buckets where id = 'product-images';
