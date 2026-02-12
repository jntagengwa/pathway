-- CreateEnum
CREATE TYPE "StaffAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'UNKNOWN');

-- CreateTable
CREATE TABLE "SessionStaffAttendance" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "status" "StaffAttendanceStatus" NOT NULL DEFAULT 'UNKNOWN',
    "markedByUserId" TEXT,
    "markedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionStaffAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SessionStaffAttendance_tenantId_idx" ON "SessionStaffAttendance"("tenantId");

-- CreateIndex
CREATE INDEX "SessionStaffAttendance_sessionId_idx" ON "SessionStaffAttendance"("sessionId");

-- CreateIndex
CREATE INDEX "SessionStaffAttendance_staffUserId_idx" ON "SessionStaffAttendance"("staffUserId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionStaffAttendance_tenantId_sessionId_staffUserId_key" ON "SessionStaffAttendance"("tenantId", "sessionId", "staffUserId");

-- AddForeignKey
ALTER TABLE "SessionStaffAttendance" ADD CONSTRAINT "SessionStaffAttendance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionStaffAttendance" ADD CONSTRAINT "SessionStaffAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionStaffAttendance" ADD CONSTRAINT "SessionStaffAttendance_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionStaffAttendance" ADD CONSTRAINT "SessionStaffAttendance_markedByUserId_fkey" FOREIGN KEY ("markedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
