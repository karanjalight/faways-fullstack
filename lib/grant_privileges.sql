-- Grant table privileges to the app's PostgREST roles.
--
-- Why this is needed:
--   The browser talks to Supabase directly as the `authenticated` role
--   (app/lib/*.ts, app/clients/page.tsx, DashboardLayout, etc.), and the
--   Next.js API routes under app/api/** talk as the `service_role`.
--   PostgREST enforces table-level GRANTs per role IN ADDITION to RLS.
--   The schema in supabase_migration.sql never granted these privileges, so
--   every query fails with: `permission denied for table <name>` (SQLSTATE
--   42501) -- e.g. POST /api/clients -> "permission denied for table
--   organizations".
--
-- Safe to run multiple times (grants are idempotent).
--
-- Apply via the Supabase SQL editor (Dashboard -> SQL Editor -> paste -> Run),
-- or: psql "<DATABASE_URL>" -f lib/grant_privileges.sql
--
-- SECURITY NOTE: RLS is disabled on nearly every table in this schema, so
-- granting to `authenticated` lets ANY logged-in user (including `client`
-- role users using the portal) read/write ALL rows in these tables directly.
-- That matches how the app currently queries tables from the browser, but if
-- you need per-client data isolation you must add RLS policies separately.

grant usage on schema public to authenticated, service_role;

-- Existing objects
grant select, insert, update, delete
  on all tables in schema public
  to authenticated, service_role;

grant usage, select
  on all sequences in schema public
  to authenticated, service_role;

grant execute
  on all functions in schema public
  to authenticated, service_role;

-- Future objects (tables/sequences/functions created later by the owner that
-- runs this script -- the SQL editor / migration runs as `postgres`).
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;

alter default privileges in schema public
  grant usage, select on sequences to authenticated, service_role;

alter default privileges in schema public
  grant execute on functions to authenticated, service_role;
