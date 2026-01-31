-- AlterTable
ALTER TABLE "User" ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastName" TEXT;

-- CreateTable
CREATE TABLE "StaffUnavailableDate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffUnavailableDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffPreferredGroup" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffPreferredGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffUnavailableDate_tenantId_idx" ON "StaffUnavailableDate"("tenantId");

-- CreateIndex
CREATE INDEX "StaffUnavailableDate_userId_idx" ON "StaffUnavailableDate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffUnavailableDate_userId_tenantId_date_key" ON "StaffUnavailableDate"("userId", "tenantId", "date");

-- CreateIndex
CREATE INDEX "StaffPreferredGroup_tenantId_idx" ON "StaffPreferredGroup"("tenantId");

-- CreateIndex
CREATE INDEX "StaffPreferredGroup_userId_idx" ON "StaffPreferredGroup"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffPreferredGroup_userId_tenantId_groupId_key" ON "StaffPreferredGroup"("userId", "tenantId", "groupId");

-- AddForeignKey
ALTER TABLE "StaffUnavailableDate" ADD CONSTRAINT "StaffUnavailableDate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffUnavailableDate" ADD CONSTRAINT "StaffUnavailableDate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffPreferredGroup" ADD CONSTRAINT "StaffPreferredGroup_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffPreferredGroup" ADD CONSTRAINT "StaffPreferredGroup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffPreferredGroup" ADD CONSTRAINT "StaffPreferredGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
