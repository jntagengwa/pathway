-- CreateEnum
CREATE TYPE "LeadKind" AS ENUM ('DEMO', 'TOOLKIT', 'TRIAL');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "kind" "LeadKind" NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "organisation" TEXT,
    "role" TEXT,
    "sector" TEXT,
    "message" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_email_kind_createdAt_idx" ON "Lead"("email", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_kind_createdAt_idx" ON "Lead"("kind", "createdAt");

