-- AlterTable
ALTER TABLE "Group" ADD COLUMN "description" TEXT,
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "sortOrder" INTEGER,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Make minAge and maxAge nullable (existing rows keep their values)
ALTER TABLE "Group" ALTER COLUMN "minAge" DROP NOT NULL;
ALTER TABLE "Group" ALTER COLUMN "maxAge" DROP NOT NULL;

-- CreateIndex: unique name per tenant
CREATE UNIQUE INDEX "Group_tenantId_name_key" ON "Group"("tenantId", "name");
