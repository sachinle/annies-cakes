-- ============================================================
-- READ-ONLY VERIFICATION — run this FIRST, on its own.
-- It changes nothing. It only lists the security rules that are
-- currently protecting your live Leo Billing data.
--
-- Why: Leo Billing's app code never calls supabase.auth.signIn*
-- anywhere (it authenticates the owner via Firebase, not Supabase
-- Auth), yet the documented RLS policies are written as
-- `user_id = auth.uid()::text`. auth.uid() is a Supabase-Auth-only
-- function — if no Supabase Auth session exists, it evaluates to
-- NULL, and a policy like that would block ALL access. Since the
-- app clearly works in production, one of these must be true:
--   (a) Supabase is configured with Firebase as a trusted external
--       JWT issuer (Authentication → Sign In / Providers) and the
--       ID token is attached to requests, so auth.uid() correctly
--       resolves to the Firebase UID, OR
--   (b) the actual policies in the database are more permissive
--       than the README describes (e.g. `USING (true)` for the
--       anon/authenticated role), and isolation today relies only
--       on the app always remembering to filter by user_id.
--
-- (b) would mean anyone with the public anon key (which is always
-- visible in the deployed app's JS bundle — that's normal) could
-- read or write ANY customer's data by calling the Supabase REST
-- API directly and omitting the user_id filter. That's worth
-- knowing regardless of the new website project.
--
-- Paste the output of this query back so we can confirm which
-- case you're in before the public website is connected to this
-- same database.
-- ============================================================

SELECT
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual        AS using_expression,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Also useful: confirm RLS is actually turned ON for each table
-- (a table can have policies defined and still be wide open if
-- row level security was never enabled on the table itself).
SELECT
  relname AS table_name,
  relrowsecurity AS rls_enabled,
  relforcerowsecurity AS rls_forced
FROM pg_class
WHERE relname IN ('business_profiles','customers','products','invoices','invoice_items')
  AND relnamespace = 'public'::regnamespace;
