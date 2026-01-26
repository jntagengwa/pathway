-- DropForeignKey
ALTER TABLE "OrgMembership" DROP CONSTRAINT "OrgMembership_orgId_fkey";

-- DropForeignKey
ALTER TABLE "OrgMembership" DROP CONSTRAINT "OrgMembership_userId_fkey";

-- DropForeignKey
ALTER TABLE "PendingOrder" DROP CONSTRAINT "PendingOrder_orgId_fkey";

-- DropForeignKey
ALTER TABLE "PendingOrder" DROP CONSTRAINT "PendingOrder_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "SiteMembership" DROP CONSTRAINT "SiteMembership_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "SiteMembership" DROP CONSTRAINT "SiteMembership_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserIdentity" DROP CONSTRAINT "UserIdentity_userId_fkey";

-- AlterTable
ALTER TABLE "OrgMembership" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PendingOrder" ADD COLUMN     "pendingOrgDetails" JSONB,
ALTER COLUMN "tenantId" DROP NOT NULL,
ALTER COLUMN "orgId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SiteMembership" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "UserIdentity" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "UserIdentity" ADD CONSTRAINT "UserIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgMembership" ADD CONSTRAINT "OrgMembership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgMembership" ADD CONSTRAINT "OrgMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteMembership" ADD CONSTRAINT "SiteMembership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteMembership" ADD CONSTRAINT "SiteMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingOrder" ADD CONSTRAINT "PendingOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingOrder" ADD CONSTRAINT "PendingOrder_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE SET NULL ON UPDATE CASCADE;
