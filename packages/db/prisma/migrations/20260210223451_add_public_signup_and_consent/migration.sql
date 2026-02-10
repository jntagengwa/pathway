-- AlterTable
ALTER TABLE "Child" ADD COLUMN     "additionalNeedsNotes" TEXT,
ADD COLUMN     "photoConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "preferredName" TEXT;

-- CreateTable
CREATE TABLE "PublicSignupLink" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicSignupLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyContact" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "relationship" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmergencyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParentSignupConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dataProcessingConsentAt" TIMESTAMP(3) NOT NULL,
    "firstAidConsentAt" TIMESTAMP(3),
    "consentingAdultName" TEXT NOT NULL,
    "consentingAdultRelationship" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParentSignupConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublicSignupLink_tenantId_revokedAt_expiresAt_idx" ON "PublicSignupLink"("tenantId", "revokedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "PublicSignupLink_orgId_idx" ON "PublicSignupLink"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "PublicSignupLink_tenantId_tokenHash_key" ON "PublicSignupLink"("tenantId", "tokenHash");

-- CreateIndex
CREATE INDEX "EmergencyContact_userId_idx" ON "EmergencyContact"("userId");

-- CreateIndex
CREATE INDEX "EmergencyContact_tenantId_idx" ON "EmergencyContact"("tenantId");

-- CreateIndex
CREATE INDEX "ParentSignupConsent_userId_idx" ON "ParentSignupConsent"("userId");

-- CreateIndex
CREATE INDEX "ParentSignupConsent_tenantId_idx" ON "ParentSignupConsent"("tenantId");

-- AddForeignKey
ALTER TABLE "PublicSignupLink" ADD CONSTRAINT "PublicSignupLink_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicSignupLink" ADD CONSTRAINT "PublicSignupLink_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicSignupLink" ADD CONSTRAINT "PublicSignupLink_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyContact" ADD CONSTRAINT "EmergencyContact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentSignupConsent" ADD CONSTRAINT "ParentSignupConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentSignupConsent" ADD CONSTRAINT "ParentSignupConsent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
