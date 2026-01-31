# Master Organisation (Internal / Platform Org)

Master organisations are non-billable, unrestricted orgs for internal use (e.g. Nexsteps team, demos, support, QA). They bypass Stripe entirely and behave like Enterprise with no limits.

## Behaviour

- **No Stripe customer** — never create or use Stripe for master orgs.
- **No subscription** — no plan enforcement; treated as unlimited everywhere.
- **Unlimited** — sites, active staff/volunteers (AV30), groups, features.
- **Cannot purchase** — purchase/upgrade/add-on flows are blocked in API and hidden in UI.
- **Enforcement** — centralised in `EntitlementsService.resolve()` (short-circuit) and `EntitlementsEnforcementService` (null cap → OK); no scattered `isMasterOrg` checks in feature code.

## Creation path (only)

Master orgs must **not** be created via public signup or marketing purchase. They may be created only by:

1. **Seed script** — add an org with `isMasterOrg: true` in a Prisma seed.
2. **Admin-only endpoint** — (if you add one) e.g. `POST /admin/orgs` with a server-side check for platform admin, creating org with `isMasterOrg: true`.
3. **Manual DB** — one-off: `UPDATE "Org" SET "isMasterOrg" = true WHERE id = '<org_id>';` or insert a new org with `isMasterOrg: true`.

No new env vars or feature flags are required. Do not hardcode org IDs in UI or backend.
