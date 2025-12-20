import { Injectable, Logger } from "@nestjs/common";
import {
  BuyNowProvider,
  type BuyNowCheckoutParams,
  type BuyNowCheckoutResult,
  type BuyNowProviderContext,
} from "../buy-now.provider";
import type { BillingProviderConfig } from "../billing-provider.config";

@Injectable()
export class GoCardlessBuyNowProvider extends BuyNowProvider {
  private readonly logger = new Logger(GoCardlessBuyNowProvider.name);

  constructor(private readonly config: BillingProviderConfig) {
    super();
  }

  async createCheckoutSession(
    params: BuyNowCheckoutParams,
    _ctx: BuyNowProviderContext,
  ): Promise<BuyNowCheckoutResult> {
    void _ctx;
    // TODO: Implement real GoCardless redirect flow creation.
    const sessionId = `gocardless_${Date.now()}`;
    const redirectUrl =
      this.config.goCardless.successUrlDefault ??
      "https://pay-sandbox.gocardless.com/redirect-flow-placeholder";

    this.logger.log(
      `Created GoCardless placeholder checkout for plan ${params.plan.planCode} pendingOrder=${params.pendingOrderId}`,
    );

    return {
      provider: "gocardless",
      sessionId,
      sessionUrl: redirectUrl,
    };
  }
}

