import { Module } from "@nestjs/common";
import { PathwayAuthModule } from "@pathway/auth";
import { CommonModule } from "../common/common.module";
import { BillingService } from "./billing.service";
import { BillingController } from "./billing.controller";
import { EntitlementsService } from "./entitlements.service";
import { EntitlementsEnforcementService } from "./entitlements-enforcement.service";
import {
  BillingWebhookController,
  billingWebhookProviderBinding,
} from "./webhook.controller";

@Module({
  imports: [PathwayAuthModule, CommonModule],
  controllers: [BillingController, BillingWebhookController],
  providers: [
    BillingService,
    EntitlementsService,
    EntitlementsEnforcementService,
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
