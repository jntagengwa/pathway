-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('ALL', 'PARENTS', 'STAFF');

-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN     "audience" "AnnouncementAudience" NOT NULL DEFAULT 'ALL';

-- CreateIndex
CREATE INDEX "Announcement_tenantId_audience_publishedAt_idx" ON "Announcement"("tenantId", "audience", "publishedAt");
