-- CreateEnum
CREATE TYPE "PendingOrderStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "PendingOrder" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "planCode" TEXT NOT NULL,
    "av30Cap" INTEGER,
    "storageGbCap" INTEGER,
    "smsMessagesCap" INTEGER,
    "leaderSeatsIncluded" INTEGER,
    "maxSites" INTEGER,
    "flags" JSONB,
    "warnings" JSONB,
    "provider" "BillingProvider" NOT NULL,
    "providerCheckoutId" TEXT,
    "providerCustomerId" TEXT,
    "providerSubscriptionId" TEXT,
    "status" "PendingOrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PendingOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PendingOrder_tenantId_orgId_provider_providerCheckoutId_idx" ON "PendingOrder"("tenantId", "orgId", "provider", "providerCheckoutId");

-- CreateIndex
CREATE INDEX "PendingOrder_provider_providerSubscriptionId_idx" ON "PendingOrder"("provider", "providerSubscriptionId");

-- AddForeignKey
ALTER TABLE "PendingOrder" ADD CONSTRAINT "PendingOrder_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PendingOrder" ADD CONSTRAINT "PendingOrder_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Org"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enable RLS
ALTER TABLE "PendingOrder" ENABLE ROW LEVEL SECURITY;

-- Tenant-scoped policy
CREATE POLICY "PendingOrder_tenant_rls" ON "PendingOrder"
  USING (app.current_tenant_id() IS NOT NULL AND "tenantId" = app.current_tenant_id())
  WITH CHECK (app.current_tenant_id() IS NOT NULL AND "tenantId" = app.current_tenant_id());

