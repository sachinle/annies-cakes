-- ============================================================
-- 0014 — Multiple UPI accounts per business
--
-- Adds a list of UPI IDs to the existing business_profiles row so the
-- owner can keep two or three and switch which one is live.
--
-- Deliberately a JSONB column on business_profiles rather than a new
-- table. That row is already read and written by Leo Billing's Profile
-- screen, so this needs no new access path and no new RLS policy — and
-- when business_profiles RLS is eventually tightened, this is covered
-- by the same fix instead of being a second thing to remember.
--
-- The existing `upi_id` column is left completely alone. Leo Billing
-- still writes it, invoices still read it, and it stays the fallback if
-- the list is empty.
--
-- Shape:
--   [{ "label": "HDFC", "vpa": "name@okhdfcbank", "enabled": true }]
--
-- SAFE TO RUN ON PRODUCTION: additive only. No column is dropped,
-- renamed, or rewritten, and no existing row's data changes.
-- ============================================================

alter table business_profiles
  add column if not exists upi_accounts jsonb not null default '[]'::jsonb;

comment on column business_profiles.upi_accounts is
  'List of UPI IDs: [{label, vpa, enabled}]. The first enabled entry is what the website offers customers. Falls back to upi_id when empty.';

-- Seed the list from the single upi_id already on file, so nobody has
-- to retype what is already there. Only touches rows that still have an
-- empty list, which makes this safe to re-run.
update business_profiles
set upi_accounts = jsonb_build_array(
      jsonb_build_object(
        'label',   coalesce(nullif(split_part(upi_id, '@', 2), ''), 'Primary'),
        'vpa',     upi_id,
        'enabled', true
      )
    )
where coalesce(upi_id, '') <> ''
  and (upi_accounts is null or jsonb_array_length(upi_accounts) = 0);

-- ── Verify ──────────────────────────────────────────────────
-- select user_id, shop_name, upi_id, upi_accounts
-- from business_profiles;
