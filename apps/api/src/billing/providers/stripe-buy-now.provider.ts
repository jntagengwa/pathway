import Stripe from "stripe";
import { Injectable, Logger } from "@nestjs/common";
import {
  BuyNowProvider,
  type BuyNowCheckoutParams,
  type BuyNowCheckoutResult,
  type BuyNowProviderContext,
} from "../buy-now.provider";
import type { BillingProviderConfig, StripePriceMap } from "../billing-provider.config";
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
    const priceMap: StripePriceMap = this.config.stripe.priceMap ?? {};
    const planCode = params.plan.planCode as PlanCode;
    const basePriceId = priceMap[planCode];

    if (!basePriceId) {
      this.logger.warn(
        `Stripe priceId missing for planCode=${params.plan.planCode}; aborting checkout`,
      );
      throw new Error("Price configuration missing for selected plan");
    }

    const successUrl =
      params.successUrl ?? this.config.stripe.successUrlDefault ?? "";
    const cancelUrl =
      params.cancelUrl ?? this.config.stripe.cancelUrlDefault ?? "";

    const billingInterval = planCode.endsWith("_MONTHLY")
      ? "monthly"
      : planCode.endsWith("_YEARLY")
        ? "yearly"
        : "monthly";
    const intervalSuffix = billingInterval === "yearly" ? "YEARLY" : "MONTHLY";

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: basePriceId, quantity: 1 },
    ];

    // AV30 add-on blocks: Growth uses 50-block price (admin sends blocks*2), Starter uses 25-block
    const av30Blocks = Math.max(0, params.plan.av30AddonBlocks ?? 0);
    if (av30Blocks > 0) {
      const isGrowth = String(planCode).startsWith("GROWTH");
      const addonCode = isGrowth
        ? (`AV30_BLOCK_50_${intervalSuffix}` as keyof StripePriceMap)
        : (`AV30_BLOCK_25_${intervalSuffix}` as keyof StripePriceMap);
      const addonPriceId = priceMap[addonCode];
      const qty = isGrowth ? Math.floor(av30Blocks / 2) : av30Blocks;
      if (addonPriceId && qty > 0) {
        lineItems.push({ price: addonPriceId, quantity: qty });
      }
    }

    // Storage add-on: use monthly or yearly price to match plan interval
    const extraStorageGb = Math.max(0, params.plan.extraStorageGb ?? 0);
    if (extraStorageGb > 0) {
      const storageSuffix = intervalSuffix; // MONTHLY or YEARLY
      if (extraStorageGb === 100) {
        const id = priceMap[`STORAGE_100GB_${storageSuffix}` as keyof StripePriceMap];
        if (id) lineItems.push({ price: id, quantity: 1 });
      } else if (extraStorageGb === 200) {
        const id = priceMap[`STORAGE_200GB_${storageSuffix}` as keyof StripePriceMap];
        if (id) lineItems.push({ price: id, quantity: 1 });
      } else if (extraStorageGb === 1000) {
        const id = priceMap[`STORAGE_1TB_${storageSuffix}` as keyof StripePriceMap];
        if (id) lineItems.push({ price: id, quantity: 1 });
      }
    }

    // SMS add-on (per 1,000 messages)
    const extraSms = Math.max(0, params.plan.extraSmsMessages ?? 0);
    if (extraSms >= 1000) {
      const addonCode = (`SMS_1000_${intervalSuffix}` as keyof StripePriceMap);
      const addonPriceId = priceMap[addonCode];
      const qty = Math.floor(extraSms / 1000);
      if (addonPriceId && qty > 0) {
        lineItems.push({ price: addonPriceId, quantity: qty });
      }
    }

    const metadata: Record<string, string> = {
      pendingOrderId: params.pendingOrderId,
      tenantId: ctx.tenantId,
      orgId: ctx.orgId,
      organisation_id: ctx.orgId,
      organisation_name: params.org.orgName,
      plan_key: planCode.split("_")[0].toLowerCase(),
      billing_interval: billingInterval,
      planCode: params.plan.planCode,
      av30Cap: String(params.preview.av30Cap ?? ""),
      maxSites: String(params.preview.maxSites ?? ""),
    };

    if (params.userId) {
      metadata.initiated_by_user_id = params.userId;
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: lineItems,
      metadata,
      subscription_data: {
        metadata,
      },
    };

    if (params.stripeCustomerId) {
      sessionParams.customer = params.stripeCustomerId;
    } else {
      sessionParams.customer_email = params.org.contactEmail;
    }

    const session = await this.stripe.checkout.sessions.create(sessionParams);

    this.logger.log(
      `Created Stripe checkout session ${session.id} for org ${ctx.orgId} plan ${params.plan.planCode} (${lineItems.length} line items)`,
    );

    return {
      provider: "stripe",
      sessionId: session.id,
      sessionUrl: session.url ?? "",
    };
  }
}

