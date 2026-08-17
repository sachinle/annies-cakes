-- ============================================================
-- Make account deletion possible without destroying order history
--
-- Additive/relaxing only: a NOT NULL is dropped and a foreign key is
-- given ON DELETE SET NULL. Nothing is deleted, and no existing row
-- changes value.
--
-- WHY
-- A customer must be able to delete their account (spec §9, and it's
-- basic data-protection hygiene). But `orders.customer_id` is currently
-- NOT NULL with a plain foreign key, so deleting a customer who has
-- ordered anything would simply fail.
--
-- Order records themselves must survive: they back real invoices, and
-- GST rules in India require retaining those for years. Orders already
-- carry contact_name / contact_phone / contact_email as a snapshot
-- taken at order time, so an order stays complete and billable even
-- once it is no longer attached to a login.
--
-- After this, deleting an account: removes the sign-in and the profile
-- row, and leaves orders in place with customer_id set to null —
-- retained for the business, no longer linked to a person's account.
-- ============================================================

begin;

alter table orders
  alter column customer_id drop not null;

alter table orders
  drop constraint if exists orders_customer_id_fkey;

alter table orders
  add constraint orders_customer_id_fkey
  foreign key (customer_id) references website_customers(id)
  on delete set null;

comment on column orders.customer_id is
  'Owning customer, or null if the account was deleted. Contact details are snapshotted on the order itself, so a null here does not make the order incomplete.';

-- Reviews are different: they are public, attributed content. If the
-- account goes, the review goes with it — a person who deletes their
-- account should not still be publicly quoted on the site.
alter table product_reviews
  drop constraint if exists product_reviews_customer_id_fkey;

alter table product_reviews
  add constraint product_reviews_customer_id_fkey
  foreign key (customer_id) references website_customers(id)
  on delete cascade;

-- Order status history belongs to the order, not the person, so it
-- follows the order and is unaffected.

commit;
