-- AlterTable
ALTER TABLE "PendingOrder" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "OrgRetentionPolicy" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "attendanceRetentionDays" INTEGER NOT NULL,
    "staffActivityRetentionDays" INTEGER NOT NULL,
    "auditEventRetentionDays" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrgRetentionPolicy_orgId_key" ON "OrgRetentionPolicy"("orgId");

-- AddForeignKey
ALTER TABLE "OrgRetentionPolicy" ADD CONSTRAINT "OrgRetentionPolicy_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
