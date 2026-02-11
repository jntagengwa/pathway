-- AlterTable: add safeguarding-relevant fields to Child (public signup)
ALTER TABLE "Child" ADD COLUMN "schoolName" TEXT;
ALTER TABLE "Child" ADD COLUMN "yearGroup" TEXT;
ALTER TABLE "Child" ADD COLUMN "gpName" TEXT;
ALTER TABLE "Child" ADD COLUMN "gpPhone" TEXT;
ALTER TABLE "Child" ADD COLUMN "specialNeedsType" TEXT;
ALTER TABLE "Child" ADD COLUMN "specialNeedsOther" TEXT;
