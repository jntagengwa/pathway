import { Module } from "@nestjs/common";
import { PathwayAuthModule } from "@pathway/auth";
import { CommonModule } from "../common/common.module";
import { BillingService } from "./billing.service";
import { BillingController } from "./billing.controller";
import { EntitlementsService } from "./entitlements.service";
import { EntitlementsEnforcementService } from "./entitlements-enforcement.service";
import { PlanPreviewController } from "./plan-preview.controller";
import { PlanPreviewService } from "./plan-preview.service";
import {
  BuyNowProvider,
  FakeBuyNowProvider,
} from "./buy-now.provider";
import { BuyNowService } from "./buy-now.service";
import { BuyNowController } from "./buy-now.controller";
import {
  BillingWebhookController,
  billingWebhookProviderBinding,
} from "./webhook.controller";

@Module({
  imports: [PathwayAuthModule, CommonModule],
  controllers: [
    BillingController,
    BillingWebhookController,
    PlanPreviewController,
    BuyNowController,
  ],
  providers: [
    BillingService,
    EntitlementsService,
    EntitlementsEnforcementService,
    PlanPreviewService,
    BuyNowService,
    { provide: BuyNowProvider, useClass: FakeBuyNowProvider },
    billingWebhookProviderBinding,
  ],
  exports: [
    BillingService,
    EntitlementsService,
    EntitlementsEnforcementService,
    billingWebhookProviderBinding,
  ],
})
export class BillingModule {}
