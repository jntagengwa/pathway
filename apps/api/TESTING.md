# API E2E database setup (low-priv-first)

This documents how to run e2e tests against a **pre-migrated schema** using a **low-privilege test role** while keeping RLS enforced. The setup script now skips destructive resets unless explicitly enabled.

## Schema and URLs

- Tests use `TEST_DATABASE_URL` (preferred) or `E2E_DATABASE_URL`.
- The URL’s `schema` query param is respected; if absent we default to `public`.
- `test.setup.e2e.ts` reuses that schema for worker connections and keeps `row_security` on.

## One-time schema prep (privileged role)

Run these once against the same DB + schema that `TEST_DATABASE_URL`/`E2E_DATABASE_URL` point to:

- Apply migrations:  
  `pnpm --filter @pathway/db exec prisma migrate deploy`
- Create a low-priv test role and grant:
  - `CONNECT` on the database.
  - `USAGE` on the chosen schema.
  - `USAGE` on sequences in that schema.
  - `SELECT/INSERT/UPDATE/DELETE` on all tables in that schema.
  - `EXECUTE` on `set_config` (needed for `withTenantRlsContext` to set `app.tenant_id/app.org_id/app.user_id`).
- Keep RLS enabled; do **not** disable `row_security`.

## Normal test runs (safe, low-priv)

- Point `TEST_DATABASE_URL`/`E2E_DATABASE_URL` at the low-priv role (e.g. `...postgres://e2e_user:***@host:5432/pathway_e2e?schema=public`).
- Leave `E2E_ALLOW_RESET` unset or `false`.
- Run tests:  
  `pnpm --filter @pathway/api test:e2e`
- Behaviour in this mode:
  - `prisma migrate reset` is **skipped**; schema is assumed pre-migrated.
  - A smoke check reads `_prisma_migrations` to confirm grants; failures log a clear error and fail fast.
  - Seed data is inserted via Prisma DML under RLS with the low-priv role.

## Full reset (privileged role only, opt-in)

- Temporarily use a privileged DB user in `TEST_DATABASE_URL`/`E2E_DATABASE_URL` **or** override locally.
- Set `E2E_ALLOW_RESET=true`.
- Run `pnpm --filter @pathway/api test:e2e` once to trigger `prisma migrate reset`.
- Switch back to the low-priv role for subsequent runs.

## Safety notes

- Do **not** grant `CREATE/DROP SCHEMA`, `ALTER TABLE`, or other migration privileges to the low-priv test role.
- Keep `row_security` enabled.
- If the smoke check fails, fix grants or ensure migrations were applied with the privileged role before rerunning tests.
