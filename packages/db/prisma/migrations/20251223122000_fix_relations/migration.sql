-- Fix relation opposites for lastActiveTenant and Org memberships

ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_lastActiveTenantId_fkey";

ALTER TABLE "User"
  ADD CONSTRAINT "User_lastActiveTenantId_fkey"
  FOREIGN KEY ("lastActiveTenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Ensure Org has a back-reference to OrgMembership (Prisma needs model field; no DB change needed)
-- No direct DDL required for orgMemberships list.

-- Add back-reference array on Tenant for lastActiveUsers (no DDL needed; kept for Prisma relation parity)


