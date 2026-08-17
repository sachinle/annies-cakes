-- ============================================================
-- Store open/closed switch
--
-- One global toggle the owner flips from Leo Billing. When it's off,
-- the website stops taking orders and says so plainly, rather than
-- accepting requests nobody is going to bake.
--
-- New table only. Nothing existing is touched.
-- ============================================================

begin;

create table if not exists store_settings (
  -- Single-row table. The check constraint makes a second row
  -- impossible, so there is never any doubt which row is "the" setting.
  id                 boolean primary key default true check (id),
  accepting_orders   boolean not null default true,
  offline_message    text,
  updated_at         timestamptz not null default now()
);

insert into store_settings (id, accepting_orders, offline_message)
values (true, true, null)
on conflict (id) do nothing;

comment on table store_settings is
  'Single-row global settings. accepting_orders=false puts the website into "not taking orders" mode.';
comment on column store_settings.offline_message is
  'Optional custom wording shown to customers while closed. Falls back to a default message when null.';

-- Same posture as the other admin tables: RLS on, no anon policies.
-- The website reads it with the service role; Leo Billing goes through
-- /api/admin/cms.
alter table store_settings enable row level security;

commit;
