import { Injectable, Optional } from "@nestjs/common";
import { PathwayRequestContext } from "@pathway/auth";
import { prisma, BillingProvider, PendingOrderStatus } from "@pathway/db";
import { getPlanDefinition } from "./billing-plans";
import { PlanPreviewService } from "./plan-preview.service";
import type { PlanPreviewAddons } from "./plan-preview.types";
import {
  type BuyNowCheckoutRequest,
  type BuyNowCheckoutResponse,
  type BuyNowCheckoutPreview,
} from "./buy-now.types";
import {
  BuyNowProvider,
  type BuyNowCheckoutParams,
} from "./buy-now.provider";

@Injectable()
export class BuyNowService {
  constructor(
    private readonly planPreviewService: PlanPreviewService,
    private readonly provider: BuyNowProvider,
    @Optional() private readonly requestContext?: PathwayRequestContext,
  ) {}

  async checkout(request: BuyNowCheckoutRequest): Promise<BuyNowCheckoutResponse> {
    const sanitisedPlan = {
      ...request.plan,
      av30AddonBlocks: this.toNonNegativeInt(request.plan.av30AddonBlocks),
      extraSites: this.toNonNegativeInt(request.plan.extraSites),
      extraStorageGb: this.toNonNegativeInt(request.plan.extraStorageGb),
      extraSmsMessages: this.toNonNegativeInt(request.plan.extraSmsMessages),
      extraLeaderSeats: this.toNonNegativeInt(request.plan.extraLeaderSeats),
    };

    const planDefinition = getPlanDefinition(sanitisedPlan.planCode);

    const previewAddons: PlanPreviewAddons = {
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

    const billingPeriodNormalized =
      previewResult.billingPeriod && previewResult.billingPeriod !== "none"
        ? previewResult.billingPeriod
        : null;

    const preview: BuyNowCheckoutPreview = {
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

    const pendingOrder = await prisma.pendingOrder.create({
      data: {
        tenantId,
        orgId,
        planCode: sanitisedPlan.planCode,
        av30Cap: previewResult.effectiveCaps.av30Cap ?? undefined,
        storageGbCap: previewResult.effectiveCaps.storageGbCap ?? undefined,
        smsMessagesCap: previewResult.effectiveCaps.smsMessagesCap ?? undefined,
        leaderSeatsIncluded:
          previewResult.effectiveCaps.leaderSeatsIncluded ?? undefined,
        maxSites: previewResult.effectiveCaps.maxSites ?? undefined,
        flags:
          previewResult.notes?.source === "plan_catalogue"
            ? undefined
            : { source: previewResult.notes?.source },
        warnings: previewResult.notes?.warnings ?? [],
        provider: BillingProvider.STRIPE,
        status: PendingOrderStatus.PENDING,
      },
    });

    const providerParams: BuyNowCheckoutParams = {
      plan: sanitisedPlan,
      org: request.org,
      preview,
      successUrl: request.successUrl,
      cancelUrl: request.cancelUrl,
      pendingOrderId: pendingOrder.id,
    };

    const session = await this.provider.createCheckoutSession(providerParams);

    await prisma.pendingOrder.update({
      where: { id: pendingOrder.id },
      data: { providerCheckoutId: session.sessionId },
    });

    const warnings = ["price_not_included"];
    if (!planDefinition) warnings.push("unknown_plan_code");

    return {
      preview,
      provider: session.provider,
      sessionId: session.sessionId,
      sessionUrl: session.sessionUrl,
      warnings,
    };
  }

  private toNonNegativeInt(value?: number): number | undefined {
    if (typeof value !== "number" || Number.isNaN(value)) return undefined;
    return value < 0 ? 0 : Math.trunc(value);
  }
}

