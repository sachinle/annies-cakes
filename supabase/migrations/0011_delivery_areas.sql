-- ============================================================
-- Delivery serviceability by pincode
--
-- The owner lists the pincodes they deliver to, in Leo Billing.
-- The website checks a customer's pincode against this list before
-- letting them choose delivery, so nobody places an order that can't
-- actually be fulfilled.
--
-- New table only. Nothing existing is touched.
-- ============================================================

begin;

create table if not exists service_pincodes (
  id           bigint generated always as identity primary key,
  pincode      text not null unique,
  area_name    text,
  delivery_fee numeric(10,2) not null default 0,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

comment on table service_pincodes is
  'Pincodes the business delivers to. Managed in Leo Billing (Website -> Delivery Areas). The website checks against this before offering delivery.';
comment on column service_pincodes.delivery_fee is
  'Indicative delivery charge for this area, shown to the customer as an estimate. The final figure is set by the owner on the invoice.';

create index if not exists service_pincodes_pincode_idx on service_pincodes (pincode);

-- Same posture as the other CMS tables: RLS on, no anon policies.
-- The website reads it server-side with the service role and returns
-- only a yes/no answer plus the area name — the full list of areas the
-- business serves is not something the public needs to enumerate.
alter table service_pincodes enable row level security;

commit;
