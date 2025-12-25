-- Auth + Site membership alignment (Tenant == Site)
--  - Adds SiteRole enum
--  - Adds UserIdentity, OrgMembership, SiteMembership tables
--  - Makes User email/tenantId optional, adds displayName + lastActiveTenantId

-- CreateEnum
CREATE TYPE "SiteRole" AS ENUM ('SITE_ADMIN', 'STAFF', 'VIEWER');

-- AlterTable: User email/tenant optional + display name + last active tenant pointer
ALTER TABLE "User"
  ALTER COLUMN "email" DROP NOT NULL,
  ALTER COLUMN "tenantId" DROP NOT NULL,
  ADD COLUMN "displayName" TEXT,
  ADD COLUMN "lastActiveTenantId" TEXT;

ALTER TABLE "User"
  ADD CONSTRAINT "User_lastActiveTenantId_fkey"
    FOREIGN KEY ("lastActiveTenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Auth identities (Auth0 etc.)
CREATE TABLE "UserIdentity" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerSubject" TEXT NOT NULL,
  "email" TEXT,
  "displayName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UserIdentity_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "UserIdentity_provider_providerSubject_key" UNIQUE ("provider", "providerSubject"),
  CONSTRAINT "UserIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "UserIdentity_userId_idx" ON "UserIdentity"("userId");

-- Org-level membership (suite admins)
CREATE TABLE "OrgMembership" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "orgId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "OrgRole" NOT NULL DEFAULT 'ORG_MEMBER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrgMembership_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OrgMembership_orgId_userId_key" UNIQUE ("orgId", "userId"),
  CONSTRAINT "OrgMembership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OrgMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "OrgMembership_userId_idx" ON "OrgMembership"("userId");

-- Site (Tenant) membership: tenant == site for RLS
CREATE TABLE "SiteMembership" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "tenantId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "SiteRole" NOT NULL DEFAULT 'STAFF',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteMembership_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SiteMembership_tenantId_userId_key" UNIQUE ("tenantId", "userId"),
  CONSTRAINT "SiteMembership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SiteMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "SiteMembership_userId_idx" ON "SiteMembership"("userId");
CREATE INDEX "SiteMembership_tenantId_idx" ON "SiteMembership"("tenantId");

-- Backfill: preserve existing single-tenant users as lastActive + membership
UPDATE "User"
SET "lastActiveTenantId" = "tenantId"
WHERE "tenantId" IS NOT NULL
  AND "lastActiveTenantId" IS NULL;

INSERT INTO "SiteMembership" ("id", "tenantId", "userId", "role")
SELECT gen_random_uuid(), "tenantId", "id", 'SITE_ADMIN'
FROM "User"
WHERE "tenantId" IS NOT NULL
ON CONFLICT ("tenantId", "userId") DO NOTHING;


