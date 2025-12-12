-- CreateTable
CREATE TABLE "StaffActivity" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "staffUserId" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StaffActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffActivity_tenantId_occurredAt_idx" ON "StaffActivity"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "StaffActivity_tenantId_staffUserId_occurredAt_idx" ON "StaffActivity"("tenantId", "staffUserId", "occurredAt");

-- CreateIndex
CREATE INDEX "StaffActivity_orgId_occurredAt_idx" ON "StaffActivity"("orgId", "occurredAt");

-- CreateIndex
CREATE INDEX "StaffActivity_orgId_staffUserId_occurredAt_idx" ON "StaffActivity"("orgId", "staffUserId", "occurredAt");

-- AddForeignKey
ALTER TABLE "StaffActivity" ADD CONSTRAINT "StaffActivity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffActivity" ADD CONSTRAINT "StaffActivity_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffActivity" ADD CONSTRAINT "StaffActivity_staffUserId_fkey" FOREIGN KEY ("staffUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enable RLS
ALTER TABLE "StaffActivity" ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for StaffActivity (tenant-scoped)
CREATE POLICY "StaffActivity_tenant_rls" ON "StaffActivity"
  USING (app.current_tenant_id() IS NOT NULL AND "tenantId" = app.current_tenant_id())
  WITH CHECK (app.current_tenant_id() IS NOT NULL AND "tenantId" = app.current_tenant_id());
