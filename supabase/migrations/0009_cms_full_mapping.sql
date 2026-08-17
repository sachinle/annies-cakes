-- ============================================================
-- Full website mapping into Leo Billing
--
-- Brings the rest of the website's data under owner control:
--   business contact details, opening hours, map and review links,
--   social links, the trust numbers, default SEO text, the hero
--   image, and the gallery.
--
-- Before this, those lived in .env.local — changing a phone number
-- meant editing a file and redeploying. They belong in the CMS.
--
-- Additive, plus one column swap on site_content (created in 0008
-- today, read only by code updated in this same change).
-- ============================================================

begin;

-- ── 1. site_content gains grouping and field types ─────────────
-- `group_name` drives which tab a field appears under in Leo Billing.
-- `input_type` drives how it is rendered: text | textarea | image | url.
alter table site_content
  add column if not exists group_name text not null default 'content',
  add column if not exists input_type text not null default 'text';

-- Carry the old boolean over, then retire it. `multiline` was a
-- two-state flag; `input_type` needs to express image and url too.
update site_content set input_type = 'textarea' where multiline = true;
alter table site_content drop column if exists multiline;

comment on column site_content.group_name is
  'Tab in Leo Billing: content | business | seo.';
comment on column site_content.input_type is
  'How Leo Billing renders the field: text, textarea, image, or url.';

-- Existing rows belong to the Content tab.
update site_content set group_name = 'content'
where group_name = 'content' or group_name is null;

-- ── 2. Business details ────────────────────────────────────────
-- These drive the WhatsApp / Call / Directions buttons, the footer,
-- and the contact page. Empty values fall back to .env.local, so
-- nothing breaks before they are filled in.
insert into site_content (key, label, hint, input_type, group_name, sort_order) values
  ('business_phone',      'Phone number',        'Shown on the site and used by the Call button.',        'text', 'business', 100),
  ('business_whatsapp',   'WhatsApp number',     'Digits only with country code, e.g. 919876543210.',     'text', 'business', 110),
  ('business_email',      'Email address',       null,                                                    'text', 'business', 120),
  ('business_address',    'Street address',      null,                                                    'text', 'business', 130),
  ('business_city',       'City',                null,                                                    'text', 'business', 140),
  ('business_pincode',    'Pincode',             null,                                                    'text', 'business', 150),
  ('business_hours',      'Opening hours',       'e.g. Mon-Sat, 9am - 8pm',                               'text', 'business', 160),
  ('google_maps_url',     'Google Maps link',    'Used by the Get Directions button.',                    'url',  'business', 170),
  ('google_review_url',   'Google review link',  'Where customers are sent to leave a Google review.',    'url',  'business', 180),
  ('instagram_url',       'Instagram link',      null,                                                    'url',  'business', 190),
  ('facebook_url',        'Facebook link',       null,                                                    'url',  'business', 200)
on conflict (key) do nothing;

-- ── 3. Trust numbers ───────────────────────────────────────────
-- Real figures only. Seeded with the numbers the business gave, and
-- editable as they grow.
insert into site_content (key, label, value, hint, input_type, group_name, sort_order) values
  ('stat_orders',    'Orders delivered',  '1000+', 'Shown on the homepage. Use a real figure.', 'text', 'content', 210),
  ('stat_customers', 'Happy customers',   '200+',  'Shown on the homepage. Use a real figure.', 'text', 'content', 220)
on conflict (key) do nothing;

-- ── 4. Hero image + default SEO ────────────────────────────────
insert into site_content (key, label, hint, input_type, group_name, sort_order) values
  ('home_hero_image',  'Homepage hero photo', 'Landscape works best. Around 1600px wide.',                     'image',    'content', 5),
  ('seo_title',        'Search result title', 'Shown in Google. Around 60 characters.',                        'text',     'seo',     300),
  ('seo_description',  'Search description',  'The grey text under your title in Google. ~155 characters.',    'textarea', 'seo',     310)
on conflict (key) do nothing;

-- ── 5. Gallery ─────────────────────────────────────────────────
create table if not exists gallery_images (
  id           bigint generated always as identity primary key,
  image_url    text not null,
  image_path   text,
  caption      text,
  alt_text     text,
  sort_order   integer not null default 0,
  is_published boolean not null default true,
  created_at   timestamptz not null default now()
);

comment on table gallery_images is
  'Photos on the public gallery page, managed from Leo Billing. alt_text matters for accessibility and image search.';

-- Same reasoning as 0008: RLS on, no anon policies. The website reads
-- with the service role; Leo Billing goes through /api/admin/cms.
-- Draft photos that are not published yet must not be fetchable by
-- anyone holding the public anon key.
alter table gallery_images enable row level security;

commit;

-- ── Verify ──────────────────────────────────────────────────────
-- select group_name, key, label, input_type from site_content order by sort_order;
