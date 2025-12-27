-- DropForeignKey (only if tables exist - this migration may run before tables are created)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'OrgMembership') THEN
    ALTER TABLE "OrgMembership" DROP CONSTRAINT IF EXISTS "OrgMembership_orgId_fkey";
    ALTER TABLE "OrgMembership" DROP CONSTRAINT IF EXISTS "OrgMembership_userId_fkey";
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'SiteMembership') THEN
    ALTER TABLE "SiteMembership" DROP CONSTRAINT IF EXISTS "SiteMembership_tenantId_fkey";
    ALTER TABLE "SiteMembership" DROP CONSTRAINT IF EXISTS "SiteMembership_userId_fkey";
  END IF;
END $$;

-- DropForeignKey (User table always exists)
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_tenantId_fkey";

-- DropForeignKey (UserIdentity may not exist yet)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'UserIdentity') THEN
    ALTER TABLE "UserIdentity" DROP CONSTRAINT IF EXISTS "UserIdentity_userId_fkey";
  END IF;
END $$;

-- AlterTable (only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'OrgMembership') THEN
    ALTER TABLE "OrgMembership" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "OrgMembership" ALTER COLUMN "updatedAt" DROP DEFAULT;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'SiteMembership') THEN
    ALTER TABLE "SiteMembership" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "SiteMembership" ALTER COLUMN "updatedAt" DROP DEFAULT;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'UserIdentity') THEN
    ALTER TABLE "UserIdentity" ALTER COLUMN "id" DROP DEFAULT;
    ALTER TABLE "UserIdentity" ALTER COLUMN "updatedAt" DROP DEFAULT;
  END IF;
END $$;

-- AddForeignKey (User table always exists)
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_tenantId_fkey";
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey (UserIdentity may not exist yet)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'UserIdentity') THEN
    ALTER TABLE "UserIdentity" DROP CONSTRAINT IF EXISTS "UserIdentity_userId_fkey";
    ALTER TABLE "UserIdentity" ADD CONSTRAINT "UserIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- AddForeignKey (only if tables exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'OrgMembership') THEN
    ALTER TABLE "OrgMembership" DROP CONSTRAINT IF EXISTS "OrgMembership_orgId_fkey";
    ALTER TABLE "OrgMembership" ADD CONSTRAINT "OrgMembership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    
    ALTER TABLE "OrgMembership" DROP CONSTRAINT IF EXISTS "OrgMembership_userId_fkey";
    ALTER TABLE "OrgMembership" ADD CONSTRAINT "OrgMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'app' AND table_name = 'SiteMembership') THEN
    ALTER TABLE "SiteMembership" DROP CONSTRAINT IF EXISTS "SiteMembership_tenantId_fkey";
    ALTER TABLE "SiteMembership" ADD CONSTRAINT "SiteMembership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    
    ALTER TABLE "SiteMembership" DROP CONSTRAINT IF EXISTS "SiteMembership_userId_fkey";
    ALTER TABLE "SiteMembership" ADD CONSTRAINT "SiteMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
