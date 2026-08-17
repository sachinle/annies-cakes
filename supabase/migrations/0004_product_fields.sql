-- ============================================================
-- Product fields for the storefront + working inventory & tax
--
-- Additive only. Every column is new or already added by 0001.
-- No existing Leo Billing column is renamed, retyped, or dropped,
-- so current billing screens and queries behave identically.
-- ============================================================

begin;

-- ── Tax / compliance ───────────────────────────────────────────
-- HSN code is required on GST invoices in India. `gst_rate` already
-- exists on products but had no HSN companion.
alter table products
  add column if not exists hsn_code text;

comment on column products.hsn_code is
  'HSN/SAC code for GST invoices. Bakery products are commonly 1905.';

-- ── Inventory ──────────────────────────────────────────────────
-- `stock` already exists but nothing decrements it. These two make
-- stock tracking opt-in per product, so made-to-order cakes (which
-- have no meaningful stock count) are not dragged into it, while
-- shelf items like brownies and biscuits can be tracked properly.
alter table products
  add column if not exists track_stock boolean not null default false,
  add column if not exists low_stock_threshold integer not null default 5;

comment on column products.track_stock is
  'When true, invoicing this product decrements `stock`. Off by default: made-to-order cakes are baked per order and have no stock count.';

-- ── Storefront size/price options ──────────────────────────────
-- `variants` (jsonb, added in 0001) holds the sizes a customer can
-- actually choose, each with the real price they pay:
--   [{"label":"500 g","price":450},{"label":"1 kg","price":800}]
--
-- Deliberately explicit rather than derived. The billing catalogue
-- stores some sizes as separate rows at per-kg-equivalent rates,
-- which cannot be reliably converted into a customer-facing price by
-- rule (e.g. Millet Brownie exists at both 600 and 1200; Mango Blast
-- 500g is priced below its 1 kg row). Guessing here would put wrong
-- prices on a public page, so the owner enters each size once.
comment on column products.variants is
  'Customer-selectable sizes for the website: [{"label":"1 kg","price":800}]. Price is the total the customer pays for that size, not a rate.';

commit;

-- ── Verify ──────────────────────────────────────────────────────
-- select id, name, hsn_code, track_stock, low_stock_threshold, variants
-- from products order by name limit 10;
