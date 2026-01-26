import Stripe from "stripe";
import { Injectable, Logger } from "@nestjs/common";
import {
  BuyNowProvider,
  type BuyNowCheckoutParams,
  type BuyNowCheckoutResult,
  type BuyNowProviderContext,
} from "../buy-now.provider";
import type { BillingProviderConfig } from "../billing-provider.config";
import type { PlanCode } from "../billing-plans";

@Injectable()
export class StripeBuyNowProvider extends BuyNowProvider {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeBuyNowProvider.name);

  constructor(private readonly config: BillingProviderConfig) {
    super();
    if (!config.stripe.secretKey) {
      throw new Error("Stripe secret key is required for Stripe provider");
    }
    this.stripe = new Stripe(config.stripe.secretKey ?? "", {
      apiVersion: "2023-10-16",
    });
  }

  async createCheckoutSession(
    params: BuyNowCheckoutParams,
    ctx: BuyNowProviderContext,
  ): Promise<BuyNowCheckoutResult> {
    const priceMap = this.config.stripe.priceMap ?? {};
    const planCode = params.plan.planCode as PlanCode;
    const priceId = priceMap[planCode];

    if (!priceId) {
      this.logger.warn(
        `Stripe priceId missing for planCode=${params.plan.planCode}; aborting checkout`,
      );
      throw new Error("Price configuration missing for selected plan");
    }

    const successUrl =
      params.successUrl ?? this.config.stripe.successUrlDefault ?? "";
    const cancelUrl =
      params.cancelUrl ?? this.config.stripe.cancelUrlDefault ?? "";

    // Extract billing interval from plan code
    const billingInterval = planCode.endsWith("_MONTHLY")
      ? "monthly"
      : planCode.endsWith("_YEARLY")
        ? "yearly"
        : "unknown";

    // Build enhanced metadata as per requirements
    const metadata: Record<string, string> = {
      pendingOrderId: params.pendingOrderId,
      tenantId: ctx.tenantId,
      orgId: ctx.orgId,
      organisation_id: ctx.orgId,
      organisation_name: params.org.orgName,
      plan_key: planCode.split("_")[0].toLowerCase(), // core, starter, growth
      billing_interval: billingInterval,
      planCode: params.plan.planCode,
      av30Cap: String(params.preview.av30Cap ?? ""),
      maxSites: String(params.preview.maxSites ?? ""),
    };

    // Add initiating user ID if provided
    if (params.userId) {
      metadata.initiated_by_user_id = params.userId;
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata,
      subscription_data: {
        metadata,
      },
    };

    // If org already has a Stripe customer ID, use it
    if (params.stripeCustomerId) {
      sessionParams.customer = params.stripeCustomerId;
    } else {
      // For new customers, let Stripe create the customer and we'll store the ID via webhook
      sessionParams.customer_email = params.org.contactEmail;
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    this.logger.log(
      `Created Stripe checkout session ${session.id} for org ${ctx.orgId} plan ${params.plan.planCode}`,
    );

    return {
      provider: "stripe",
      sessionId: session.id,
      sessionUrl: session.url ?? "",
    };
  }
}

