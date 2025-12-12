-- Create enums for audit logging
CREATE TYPE "AuditAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'VIEWED');
CREATE TYPE "AuditEntityType" AS ENUM ('CONCERN', 'CHILD_NOTE');

-- Soft-delete handling for concerns
ALTER TABLE "Concern"
ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Parent visibility groundwork for child notes
ALTER TABLE "ChildNote"
ADD COLUMN "visibleToParents" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "approvedByUserId" TEXT,
ADD COLUMN "approvedAt" TIMESTAMP(3);

ALTER TABLE "ChildNote"
ADD CONSTRAINT "ChildNote_approvedByUserId_fkey"
FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- AuditEvent table
CREATE TABLE "AuditEvent" (
  "id" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tenantId" TEXT NOT NULL,
  "orgId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "entityType" "AuditEntityType" NOT NULL,
  "entityId" TEXT,
  "action" "AuditAction" NOT NULL,
  "metadata" JSONB,
  CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AuditEvent"
ADD CONSTRAINT "AuditEvent_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditEvent"
ADD CONSTRAINT "AuditEvent_orgId_fkey"
FOREIGN KEY ("orgId") REFERENCES "Org"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditEvent"
ADD CONSTRAINT "AuditEvent_actorUserId_fkey"
FOREIGN KEY ("actorUserId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "AuditEvent_tenantId_createdAt_idx"
ON "AuditEvent"("tenantId", "createdAt");

CREATE INDEX "AuditEvent_orgId_createdAt_idx"
ON "AuditEvent"("orgId", "createdAt");

CREATE INDEX "AuditEvent_actorUserId_createdAt_idx"
ON "AuditEvent"("actorUserId", "createdAt");

CREATE INDEX "AuditEvent_entityType_entityId_idx"
ON "AuditEvent"("entityType", "entityId");

