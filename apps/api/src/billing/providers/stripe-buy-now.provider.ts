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

    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        pendingOrderId: params.pendingOrderId,
        tenantId: ctx.tenantId,
        orgId: ctx.orgId,
        planCode: params.plan.planCode,
        av30Cap: String(params.preview.av30Cap ?? ""),
        maxSites: String(params.preview.maxSites ?? ""),
      },
    });

    this.logger.log(
      `Created Stripe checkout session for plan ${params.plan.planCode} pendingOrder=${params.pendingOrderId}`,
    );

    return {
      provider: "stripe",
      sessionId: session.id,
      sessionUrl: session.url ?? "",
    };
  }
}

