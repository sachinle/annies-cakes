-- ============================================================
-- Annie's Homemade Cakes — public website schema (additive only)
--
-- Safety guarantees:
--   * No existing table is altered except `products`, and only via
--     ADD COLUMN IF NOT EXISTS with safe defaults — every existing
--     column, row, index, policy, and query in Leo Billing is
--     untouched and keeps working exactly as it does today.
--   * No existing table is dropped, renamed, or has rows changed.
--   * All new tables are new, isolated, and carry their own RLS.
--   * Run 0000_check_existing_rls.sql first and confirm the result
--     with Claude before running this file.
-- ============================================================

create extension if not exists pgcrypto;

-- ── 1. Extend products for the storefront ──────────────────────
-- Every column is nullable or has a default that preserves current
-- behavior (is_active defaults to true, so every existing product
-- is immediately visible on the website with no data entry needed).
alter table products
  add column if not exists slug               text,
  add column if not exists short_description   text,
  add column if not exists image_url           text,
  add column if not exists image_path          text,
  add column if not exists is_active           boolean not null default true,
  add column if not exists is_featured         boolean not null default false,
  add column if not exists variants            jsonb   not null default '[]'::jsonb,
  add column if not exists tags                text[]  not null default '{}',
  add column if not exists rating_avg          numeric(2,1) not null default 0,
  add column if not exists rating_count        integer not null default 0;

create unique index if not exists products_slug_key
  on products (slug) where slug is not null;

-- ── 2. website_customers — profile for real, public, Supabase-auth
--       customers. Completely separate from Leo Billing's `customers`
--       table (which stays exactly as-is, for the owner's own CRM).
create table if not exists website_customers (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── 3. orders — website order requests. Deliberately a NEW table,
--       separate from Leo Billing's `invoices`. An invoice is only
--       created (in Leo Billing) after the owner confirms an order;
--       invoice_id is then filled in to link the two.
create table if not exists orders (
  id                     uuid primary key default gen_random_uuid(),
  order_no               text unique not null,
  customer_id            uuid not null references website_customers(id),
  product_id             bigint references products(id),
  product_name           text not null,
  variant                jsonb not null default '{}'::jsonb, -- size / flavour / egg-eggless / theme
  addons                 jsonb not null default '[]'::jsonb,
  quantity               integer not null default 1,
  cake_message            text,
  special_instructions    text,
  reference_image_url     text,
  fulfillment_type        text not null default 'pickup' check (fulfillment_type in ('pickup','delivery')),
  address                text,
  city                   text,
  pincode                text,
  landmark               text,
  preferred_date          date,
  preferred_time          text,
  contact_name            text not null,
  contact_phone           text not null,
  contact_email           text,
  status                 text not null default 'received' check (status in (
                            'received','confirmed','preparing','ready',
                            'out_for_delivery','completed','cancelled'
                          )),
  invoice_id             bigint references invoices(id), -- set by Leo Billing once billed
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists orders_customer_id_idx on orders (customer_id);
create index if not exists orders_status_idx      on orders (status);

-- ── 4. order_status_history — the timeline the customer sees ────
create table if not exists order_status_history (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references orders(id) on delete cascade,
  status      text not null,
  note        text,
  created_at  timestamptz not null default now()
);

-- ── 5. product_reviews — one review per completed order ─────────
create table if not exists product_reviews (
  id            bigint generated always as identity primary key,
  product_id    bigint not null references products(id),
  order_id      uuid not null references orders(id),
  customer_id   uuid not null references website_customers(id),
  rating        smallint not null check (rating between 1 and 5),
  review_text   text,
  photo_url     text,
  display_name  text,
  is_published  boolean not null default true,
  created_at    timestamptz not null default now(),
  unique (order_id)
);

-- keep products.rating_avg / rating_count in sync automatically
create or replace function refresh_product_rating() returns trigger as $$
begin
  update products p
  set rating_avg   = coalesce((select round(avg(rating)::numeric,1) from product_reviews where product_id = coalesce(new.product_id, old.product_id) and is_published), 0),
      rating_count = coalesce((select count(*) from product_reviews where product_id = coalesce(new.product_id, old.product_id) and is_published), 0)
  where p.id = coalesce(new.product_id, old.product_id);
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_refresh_product_rating on product_reviews;
create trigger trg_refresh_product_rating
after insert or update or delete on product_reviews
for each row execute function refresh_product_rating();

-- ── Row Level Security ───────────────────────────────────────────
-- These are brand-new tables, so enabling RLS here cannot break
-- anything that exists today.
alter table website_customers    enable row level security;
alter table orders               enable row level security;
alter table order_status_history enable row level security;
alter table product_reviews      enable row level security;

-- website_customers: a customer can only see / edit their own profile
create policy "customer reads own profile"   on website_customers for select using (id = auth.uid());
create policy "customer inserts own profile" on website_customers for insert with check (id = auth.uid());
create policy "customer updates own profile" on website_customers for update using (id = auth.uid());

-- orders: a customer can only see and create their own orders.
-- No public UPDATE/DELETE policy at all — status changes only ever
-- happen server-side (via the service role key, from the Leo
-- Billing → website sync layer), never directly from a browser.
create policy "customer reads own orders"  on orders for select using (customer_id = auth.uid());
create policy "customer creates own orders" on orders for insert with check (customer_id = auth.uid());

-- order_status_history: readable only by the owning customer
create policy "customer reads own order history" on order_status_history for select
  using (exists (select 1 from orders o where o.id = order_status_history.order_id and o.customer_id = auth.uid()));

-- product_reviews: published reviews are public; a customer may only
-- insert a review for their OWN completed order (prevents fake /
-- duplicate / unauthorized reviews at the database level, not just
-- in application code).
create policy "anyone reads published reviews" on product_reviews for select using (is_published = true);
create policy "customer reviews own completed order" on product_reviews for insert
  with check (
    customer_id = auth.uid()
    and exists (
      select 1 from orders o
      where o.id = product_reviews.order_id
        and o.customer_id = auth.uid()
        and o.status = 'completed'
    )
  );

-- NOTE: no RLS policy is added here granting the public/anon role
-- direct read access to `products`. The Next.js website reads the
-- product catalogue server-side using the Supabase service role key
-- (never exposed to the browser), so it can return a curated set of
-- public fields and deliberately omit internal ones (stock, gst_rate,
-- cost) — see the architecture notes for why this is safer than a
-- public RLS SELECT policy on the whole table.
