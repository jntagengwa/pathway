import { Inject, Injectable, Optional, Logger } from "@nestjs/common";
import { PathwayRequestContext } from "@pathway/auth";
import { prisma, PendingOrderStatus } from "@pathway/db";
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
  type BuyNowProviderContext,
} from "./buy-now.provider";
import {
  BILLING_PROVIDER_CONFIG,
  activeProviderToPrismaProvider,
  type BillingProviderConfig,
} from "./billing-provider.config";
import { Auth0ManagementService } from "../auth/auth0-management.service";

@Injectable()
export class BuyNowService {
  private readonly logger = new Logger(BuyNowService.name);

  constructor(
    @Inject(PlanPreviewService)
    private readonly planPreviewService: PlanPreviewService,
    @Inject(BuyNowProvider)
    private readonly provider: BuyNowProvider,
    @Inject(Auth0ManagementService)
    private readonly auth0Management: Auth0ManagementService,
    @Optional() private readonly requestContext?: PathwayRequestContext,
    @Inject(BILLING_PROVIDER_CONFIG)
    private readonly providerConfig?: BillingProviderConfig,
  ) {}

  async checkout(request: BuyNowCheckoutRequest): Promise<BuyNowCheckoutResponse> {
    // Normalize plan code for Stripe compatibility
    // Frontend sends CORE_*, Stripe expects MINIMUM_*
    const normalizedPlanCode = this.normalizePlanCode(request.plan.planCode);
    
    const sanitisedPlan = {
      ...request.plan,
      planCode: normalizedPlanCode,
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

    // For public buy-now, create org, tenant, and user on-the-fly from provided org details
    let orgId = this.requestContext?.currentOrgId;
    let tenantId = this.requestContext?.currentTenantId;
    
    if (!orgId || !tenantId) {
      // Public buy-now: create org, tenant, and user
      const orgSlug = this.generateSlug(request.org.orgName);
      const tenantSlug = orgSlug; // Use same slug for initial tenant
      const normalizedEmail = request.org.contactEmail.toLowerCase().trim();
      
      // Create org
      const org = await prisma.org.create({
        data: {
          name: request.org.orgName,
          slug: orgSlug,
          planCode: sanitisedPlan.planCode,
          isSuite: false,
        },
      });
      
      // Create tenant
      const tenant = await prisma.tenant.create({
        data: {
          name: request.org.orgName,
          slug: tenantSlug,
          orgId: org.id,
        },
      });
      
      orgId = org.id;
      tenantId = tenant.id;
      
      // Create user in DB
      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: request.org.contactName,
          displayName: request.org.contactName,
        },
      });
      
      // Create user in Auth0 with provided password
      this.logger.log(`Creating Auth0 user for purchase: ${normalizedEmail}`);
      const auth0UserId = await this.auth0Management.createUser({
        email: normalizedEmail,
        password: request.org.password,
        name: request.org.contactName,
        emailVerified: false,
      });
      
      if (auth0UserId) {
        // Link Auth0 identity to DB user
        await prisma.userIdentity.create({
          data: {
            userId: user.id,
            provider: "auth0",
            providerSubject: auth0UserId,
            email: normalizedEmail,
            displayName: request.org.contactName,
          },
        });
        this.logger.log(`✅ Linked Auth0 user ${auth0UserId} to DB user ${user.id}`);
      } else {
        this.logger.warn(
          `Failed to create Auth0 user for ${normalizedEmail}. User can still complete purchase but may need invite link to set up Auth0 account.`,
        );
      }
      
      // Link user to org and tenant
      await prisma.userTenantRole.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: "ADMIN",
        },
      });
      
      this.logger.log(
        `✅ Created org ${org.id}, tenant ${tenant.id}, and user ${user.id} for purchase`,
      );
    }

    const prismaProvider = activeProviderToPrismaProvider(
      this.providerConfig?.activeProvider ?? "FAKE",
    );

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
        provider: prismaProvider,
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

    const providerCtx: BuyNowProviderContext = { tenantId, orgId };

    const session = await this.provider.createCheckoutSession(
      providerParams,
      providerCtx,
    );

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

  /**
   * Generate a URL-safe slug from an org name.
   */
  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 50);
    
    // Add random suffix to avoid collisions
    const suffix = Math.random().toString(36).substring(2, 8);
    return `${base}-${suffix}`;
  }

  /**
   * Normalize plan code for Stripe compatibility.
   * Frontend may send CORE_*, but Stripe expects MINIMUM_*.
   */
  private normalizePlanCode(planCode: string): string {
    if (planCode === "CORE_MONTHLY") return "MINIMUM_MONTHLY";
    if (planCode === "CORE_YEARLY") return "MINIMUM_YEARLY";
    return planCode;
  }
}

