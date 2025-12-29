var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Injectable, Optional } from "@nestjs/common";
import { PathwayRequestContext } from "@pathway/auth";
import { prisma, PendingOrderStatus } from "@pathway/db";
import { getPlanDefinition } from "./billing-plans";
import { PlanPreviewService } from "./plan-preview.service";
import { BuyNowProvider, } from "./buy-now.provider";
import { BILLING_PROVIDER_CONFIG, activeProviderToPrismaProvider, } from "./billing-provider.config";
let BuyNowService = class BuyNowService {
    planPreviewService;
    provider;
    requestContext;
    providerConfig;
    constructor(planPreviewService, provider, requestContext, providerConfig) {
        this.planPreviewService = planPreviewService;
        this.provider = provider;
        this.requestContext = requestContext;
        this.providerConfig = providerConfig;
    }
    async checkout(request) {
        const sanitisedPlan = {
            ...request.plan,
            av30AddonBlocks: this.toNonNegativeInt(request.plan.av30AddonBlocks),
            extraSites: this.toNonNegativeInt(request.plan.extraSites),
            extraStorageGb: this.toNonNegativeInt(request.plan.extraStorageGb),
            extraSmsMessages: this.toNonNegativeInt(request.plan.extraSmsMessages),
            extraLeaderSeats: this.toNonNegativeInt(request.plan.extraLeaderSeats),
        };
        const planDefinition = getPlanDefinition(sanitisedPlan.planCode);
        const previewAddons = {
            extraAv30Blocks: sanitisedPlan.av30AddonBlocks,
            extraSites: sanitisedPlan.extraSites,
            extraStorageGb: sanitisedPlan.extraStorageGb,
            extraSmsMessages: sanitisedPlan.extraSmsMessages,
            extraLeaderSeats: sanitisedPlan.extraLeaderSeats,
        };
        const previewResult = this.planPreviewService.preview({
            planCode: sanitisedPlan.planCode,
            addons: previewAddons,
        });
        const billingPeriodNormalized = previewResult.billingPeriod && previewResult.billingPeriod !== "none"
            ? previewResult.billingPeriod
            : null;
        const preview = {
            planCode: previewResult.planCode,
            planTier: previewResult.planTier,
            billingPeriod: billingPeriodNormalized,
            av30Cap: previewResult.effectiveCaps.av30Cap,
            maxSites: previewResult.effectiveCaps.maxSites,
            storageGbCap: previewResult.effectiveCaps.storageGbCap,
            smsMessagesCap: previewResult.effectiveCaps.smsMessagesCap,
            leaderSeatsIncluded: previewResult.effectiveCaps.leaderSeatsIncluded,
            source: planDefinition ? "plan_catalogue" : "fallback",
        };
        const orgId = this.requestContext?.currentOrgId;
        const tenantId = this.requestContext?.currentTenantId;
        if (!orgId || !tenantId) {
            throw new Error("orgId and tenantId are required for checkout");
        }
        const prismaProvider = activeProviderToPrismaProvider(this.providerConfig?.activeProvider ?? "FAKE");
        const pendingOrder = await prisma.pendingOrder.create({
            data: {
                tenantId,
                orgId,
                planCode: sanitisedPlan.planCode,
                av30Cap: previewResult.effectiveCaps.av30Cap ?? undefined,
                storageGbCap: previewResult.effectiveCaps.storageGbCap ?? undefined,
                smsMessagesCap: previewResult.effectiveCaps.smsMessagesCap ?? undefined,
                leaderSeatsIncluded: previewResult.effectiveCaps.leaderSeatsIncluded ?? undefined,
                maxSites: previewResult.effectiveCaps.maxSites ?? undefined,
                flags: previewResult.notes?.source === "plan_catalogue"
                    ? undefined
                    : { source: previewResult.notes?.source },
                warnings: previewResult.notes?.warnings ?? [],
                provider: prismaProvider,
                status: PendingOrderStatus.PENDING,
            },
        });
        const providerParams = {
            plan: sanitisedPlan,
            org: request.org,
            preview,
            successUrl: request.successUrl,
            cancelUrl: request.cancelUrl,
            pendingOrderId: pendingOrder.id,
        };
        const providerCtx = { tenantId, orgId };
        const session = await this.provider.createCheckoutSession(providerParams, providerCtx);
        await prisma.pendingOrder.update({
            where: { id: pendingOrder.id },
            data: { providerCheckoutId: session.sessionId },
        });
        const warnings = ["price_not_included"];
        if (!planDefinition)
            warnings.push("unknown_plan_code");
        return {
            preview,
            provider: session.provider,
            sessionId: session.sessionId,
            sessionUrl: session.sessionUrl,
            warnings,
        };
    }
    toNonNegativeInt(value) {
        if (typeof value !== "number" || Number.isNaN(value))
            return undefined;
        return value < 0 ? 0 : Math.trunc(value);
    }
};
BuyNowService = __decorate([
    Injectable(),
    __param(0, Inject(PlanPreviewService)),
    __param(1, Inject(BuyNowProvider)),
    __param(2, Optional()),
    __param(3, Inject(BILLING_PROVIDER_CONFIG)),
    __metadata("design:paramtypes", [PlanPreviewService,
        BuyNowProvider,
        PathwayRequestContext, Object])
], BuyNowService);
export { BuyNowService };
