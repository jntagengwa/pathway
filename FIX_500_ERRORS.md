# Fix for 500 Internal Server Errors

## Root Cause
The Prisma client needs to be regenerated after adding the `name` field to the `Invite` model. The database migration has been created, but the Prisma client types haven't been updated yet.

## Steps to Fix

1. **Run the database migration** (if not already done):
   ```bash
   pnpm --filter @pathway/db prisma migrate deploy
   ```
   Or in development:
   ```bash
   pnpm --filter @pathway/db prisma migrate dev
   ```

2. **Regenerate the Prisma client**:
   ```bash
   pnpm --filter @pathway/db prisma generate
   ```

3. **Restart the API server** to pick up the new Prisma client:
   ```bash
   # Stop the current API server, then restart it
   pnpm --filter @pathway/api dev
   ```

## Temporary Workaround
The code currently uses `as any` type assertions to work around the missing Prisma types. Once the Prisma client is regenerated, these can be removed, but they won't cause runtime issues.

## Files That Need Prisma Client Regeneration
- `apps/api/src/invites/invites.service.ts` - Uses `name` field on Invite model
- Any other files that interact with the Invite model

## Verification
After regenerating Prisma client and restarting the API:
- `/orgs/:orgId/people` endpoint should return 200
- `/orgs/:orgId/invites?status=pending` endpoint should return 200
- Other endpoints should work normally

