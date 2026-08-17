-- ============================================================
-- Website control from Leo Billing (CMS)
--
-- Adds three things the owner controls from the billing app:
--   site_content — editable text blocks on the public site
--   offers       — promotional banners with optional date windows
--   review moderation — reviews stay hidden until approved
--
-- Additive. Two new tables plus a default change on a column created
-- in 0001 that nothing has written to yet.
-- ============================================================

begin;

-- ── 1. Editable site content ───────────────────────────────────
-- Key/value rather than a column per field, so new editable blocks
-- can be added later without another migration. `key` is a stable
-- identifier the website looks up; the owner only ever edits `value`.
create table if not exists site_content (
  key         text primary key,
  value       text not null default '',
  label       text not null,
  hint        text,
  multiline   boolean not null default false,
  sort_order  integer not null default 0,
  updated_at  timestamptz not null default now()
);

comment on table site_content is
  'Editable website copy, managed from Leo Billing. Keys are referenced by the Next.js site.';

-- Seed the blocks the site reads today. Values start empty so the
-- website keeps using its built-in defaults until the owner writes
-- something — an empty CMS must never blank out the homepage.
insert into site_content (key, label, hint, multiline, sort_order) values
  ('home_hero_heading',     'Homepage headline',        'The first line visitors read.',                  false, 10),
  ('home_hero_subheading',  'Homepage sub-heading',     'One or two sentences under the headline.',       true,  20),
  ('home_about_heading',    'Why order from us — title', null,                                            false, 30),
  ('home_about_body',       'Why order from us — text', 'One point per line.',                            true,  40),
  ('about_story',           'About page — our story',   'The genuine story of how the business started.', true,  50),
  ('about_hygiene',         'About page — how we bake', 'How you keep the kitchen clean and hygienic.',   true,  60),
  ('faq_answers',           'FAQ answers',              'One per line as: Question | Answer',             true,  70),
  ('contact_hours',         'Business hours',           'e.g. Mon-Sat, 9am - 8pm',                        false, 80)
on conflict (key) do nothing;

-- ── 2. Offers ──────────────────────────────────────────────────
create table if not exists offers (
  id          bigint generated always as identity primary key,
  title       text not null,
  description text,
  code        text,
  starts_at   date,
  ends_at     date,
  is_active   boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

comment on table offers is
  'Promotional offers shown on the website. is_active plus the date window both have to pass for an offer to appear.';

-- ── 3. Review moderation ───────────────────────────────────────
-- 0001 created product_reviews.is_published defaulting to true, which
-- would put a review straight onto the public site. The owner wants to
-- approve each one first, so the default flips to false. No existing
-- rows are affected (there are none yet).
alter table product_reviews
  alter column is_published set default false;

comment on column product_reviews.is_published is
  'False until the owner approves the review in Leo Billing. Only published reviews are publicly readable (see RLS) or counted in a product rating.';

-- The rating trigger from 0001 already counts published reviews only,
-- so an unapproved review cannot move a product's star rating.

-- ── 4. Row Level Security ──────────────────────────────────────
-- RLS on, and deliberately NO policies for the anon/authenticated
-- roles. Nothing reaches these tables with just the public anon key
-- (which ships inside every deployed bundle and is therefore known to
-- anyone who looks).
--
-- Both legitimate readers still work:
--   * the public website reads with the service role key, server-side,
--     and returns only the fields a visitor should see;
--   * Leo Billing reads and writes through /api/admin/cms, which
--     verifies the owner's Firebase ID token before touching anything.
--
-- Without this, anyone could rewrite the homepage headline or publish
-- their own "offers" on the site.
alter table site_content enable row level security;
alter table offers       enable row level security;

commit;

-- ── Verify ──────────────────────────────────────────────────────
-- select key, label from site_content order by sort_order;
-- select column_default from information_schema.columns
--   where table_name='product_reviews' and column_name='is_published';
