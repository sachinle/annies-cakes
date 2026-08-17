-- ============================================================
-- 1. Let invoices be deleted   2. Basket (multi-item) orders
--
-- Additive plus one foreign-key rule change. No data is destroyed by
-- this migration; existing orders are backfilled into the new items
-- table so nothing is lost.
-- ============================================================

begin;

-- ── 1. Deleting an invoice ─────────────────────────────────────
-- orders.invoice_id referenced invoices(id) with no ON DELETE rule,
-- which defaults to NO ACTION — so Postgres refused to delete any
-- invoice that a website order pointed at. That's why "delete invoice"
-- failed for bills raised from the website.
--
-- SET NULL is the right rule here: the invoice goes, the order stays
-- (it's the customer's request, not a financial record), and because
-- the website shows a bill only when invoice_id is present, the bill
-- disappears from the customer's account the moment it's deleted.
alter table orders
  drop constraint if exists orders_customer_id_fkey1;

alter table orders
  drop constraint if exists orders_invoice_id_fkey;

alter table orders
  add constraint orders_invoice_id_fkey
  foreign key (invoice_id) references invoices(id)
  on delete set null;

comment on column orders.invoice_id is
  'Bill raised in Leo Billing for this order, or null. Cleared automatically if the invoice is deleted, which also hides the bill from the customer.';

-- ── 2. Basket orders ───────────────────────────────────────────
-- Orders were one cake each. A cart means several, so the lines move
-- into their own table. The single-item columns on `orders` are left
-- in place: they still carry the delivery, contact, and scheduling
-- details, and dropping them would break the two orders already placed.
create table if not exists order_items (
  id            bigint generated always as identity primary key,
  order_id      uuid not null references orders(id) on delete cascade,
  product_id    bigint references products(id),
  product_name  text not null,
  variant_label text,
  unit_price    numeric(10,2) not null default 0,
  quantity      integer not null default 1 check (quantity > 0),
  line_total    numeric(10,2) not null default 0,
  colour        text,
  cake_message  text,
  created_at    timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on order_items (order_id);

comment on table order_items is
  'Individual cakes within one order. Prices are snapshots taken when the order was placed, never recalculated from products.';

-- Backfill the orders that exist today so every order has line items
-- and the app can read from one place.
insert into order_items (order_id, product_id, product_name, variant_label, unit_price, quantity, line_total, colour, cake_message)
select
  o.id,
  o.product_id,
  o.product_name,
  o.variant_label,
  coalesce(o.unit_price, 0),
  coalesce(o.quantity, 1),
  coalesce(o.estimated_total, coalesce(o.unit_price, 0) * coalesce(o.quantity, 1)),
  o.variant ->> 'colour',
  o.cake_message
from orders o
where not exists (select 1 from order_items i where i.order_id = o.id);

-- ── 3. Saved cart ──────────────────────────────────────────────
-- One row per cake a signed-in customer has added. Keyed to the
-- account, so the basket follows them between phone and laptop.
create table if not exists cart_items (
  id            bigint generated always as identity primary key,
  customer_id   uuid not null references website_customers(id) on delete cascade,
  product_id    bigint not null references products(id) on delete cascade,
  variant_label text,
  quantity      integer not null default 1 check (quantity > 0 and quantity <= 20),
  colour        text,
  cake_message  text,
  updated_at    timestamptz not null default now(),
  -- The same cake in a different size is a separate line; the same cake
  -- in the same size just increases quantity.
  unique (customer_id, product_id, variant_label)
);

create index if not exists cart_items_customer_idx on cart_items (customer_id);

-- ── RLS ────────────────────────────────────────────────────────
alter table order_items enable row level security;
alter table cart_items  enable row level security;

-- A customer sees the lines of their own orders, and nobody else's.
create policy "customer reads own order items" on order_items for select
  using (exists (
    select 1 from orders o
    where o.id = order_items.order_id and o.customer_id = auth.uid()
  ));

create policy "customer adds items to own order" on order_items for insert
  with check (exists (
    select 1 from orders o
    where o.id = order_items.order_id and o.customer_id = auth.uid()
  ));

-- A cart belongs entirely to its owner.
create policy "customer reads own cart"   on cart_items for select using (customer_id = auth.uid());
create policy "customer adds to own cart" on cart_items for insert with check (customer_id = auth.uid());
create policy "customer edits own cart"   on cart_items for update using (customer_id = auth.uid());
create policy "customer clears own cart"  on cart_items for delete using (customer_id = auth.uid());

commit;

-- ── Verify ──────────────────────────────────────────────────────
-- select o.order_no, count(i.id) as lines
-- from orders o left join order_items i on i.order_id = o.id
-- group by o.order_no;
