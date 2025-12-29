var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from "@nestjs/common";
import { PathwayAuthModule } from "@pathway/auth";
import { CommonModule } from "../common/common.module";
import { AuthModule } from "../auth/auth.module";
import { BillingService } from "./billing.service";
import { BillingController } from "./billing.controller";
import { EntitlementsService } from "./entitlements.service";
import { EntitlementsEnforcementService } from "./entitlements-enforcement.service";
import { PlanPreviewController } from "./plan-preview.controller";
import { PlanPreviewService } from "./plan-preview.service";
import { BuyNowProvider } from "./buy-now.provider";
import { BuyNowService } from "./buy-now.service";
import { BuyNowController } from "./buy-now.controller";
import { BillingPricingController } from "./pricing.controller";
import { BillingPricingService } from "./pricing.service";
import { BillingWebhookController, } from "./webhook.controller";
import { BILLING_PROVIDER_CONFIG, loadBillingProviderConfig, } from "./billing-provider.config";
import { createBillingWebhookProvider, createBuyNowProvider, } from "./providers/provider.factory";
import { BILLING_WEBHOOK_PROVIDER } from "./billing-webhook.provider";
let BillingModule = class BillingModule {
};
BillingModule = __decorate([
    Module({
        imports: [PathwayAuthModule, CommonModule, AuthModule],
        controllers: [
            BillingController,
            BillingWebhookController,
            PlanPreviewController,
            BuyNowController,
            BillingPricingController,
        ],
        providers: [
            BillingService,
            EntitlementsService,
            EntitlementsEnforcementService,
            PlanPreviewService,
            BuyNowService,
            BillingPricingService,
            {
                provide: BILLING_PROVIDER_CONFIG,
                useFactory: () => loadBillingProviderConfig(),
            },
            {
                provide: BuyNowProvider,
                useFactory: (config) => createBuyNowProvider(config),
                inject: [BILLING_PROVIDER_CONFIG],
            },
            {
                provide: BILLING_WEBHOOK_PROVIDER,
                useFactory: (config) => createBillingWebhookProvider(config),
                inject: [BILLING_PROVIDER_CONFIG],
            },
        ],
        exports: [
            BillingService,
            EntitlementsService,
            EntitlementsEnforcementService,
            BILLING_WEBHOOK_PROVIDER,
            PlanPreviewService,
            BuyNowService,
            BillingPricingService,
        ],
    })
], BillingModule);
export { BillingModule };
