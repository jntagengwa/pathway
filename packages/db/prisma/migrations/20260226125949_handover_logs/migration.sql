-- CreateEnum
CREATE TYPE "HandoverLogStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED');

-- CreateTable
CREATE TABLE "HandoverLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "handoverDate" DATE NOT NULL,
    "status" "HandoverLogStatus" NOT NULL DEFAULT 'DRAFT',
    "currentContentJson" JSONB NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HandoverLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HandoverLogVersion" (
    "id" TEXT NOT NULL,
    "handoverLogId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "contentSnapshotJson" JSONB NOT NULL,
    "editedByUserId" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeSummary" TEXT,
    "diffJson" JSONB,

    CONSTRAINT "HandoverLogVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HandoverLog_tenantId_handoverDate_idx" ON "HandoverLog"("tenantId", "handoverDate");

-- CreateIndex
CREATE INDEX "HandoverLog_tenantId_groupId_idx" ON "HandoverLog"("tenantId", "groupId");

-- CreateIndex
CREATE INDEX "HandoverLog_status_idx" ON "HandoverLog"("status");

-- CreateIndex
CREATE UNIQUE INDEX "HandoverLog_tenantId_groupId_handoverDate_key" ON "HandoverLog"("tenantId", "groupId", "handoverDate");

-- CreateIndex
CREATE INDEX "HandoverLogVersion_handoverLogId_versionNumber_idx" ON "HandoverLogVersion"("handoverLogId", "versionNumber");

-- AddForeignKey
ALTER TABLE "HandoverLog" ADD CONSTRAINT "HandoverLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverLog" ADD CONSTRAINT "HandoverLog_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverLog" ADD CONSTRAINT "HandoverLog_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverLog" ADD CONSTRAINT "HandoverLog_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverLogVersion" ADD CONSTRAINT "HandoverLogVersion_handoverLogId_fkey" FOREIGN KEY ("handoverLogId") REFERENCES "HandoverLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HandoverLogVersion" ADD CONSTRAINT "HandoverLogVersion_editedByUserId_fkey" FOREIGN KEY ("editedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
