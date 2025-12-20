import { Injectable, Logger } from "@nestjs/common";
import type {
  BuyNowOrgDetails,
  BuyNowPlanSelection,
  BuyNowCheckoutPreview,
} from "./buy-now.types";

export interface BuyNowCheckoutParams {
  plan: BuyNowPlanSelection;
  org: BuyNowOrgDetails;
  preview: BuyNowCheckoutPreview;
  successUrl?: string;
  cancelUrl?: string;
  pendingOrderId: string;
}

export interface BuyNowProviderContext {
  tenantId: string;
  orgId: string;
}

export interface BuyNowCheckoutResult {
  provider: "fake" | "stripe" | "gocardless";
  sessionId: string;
  sessionUrl: string;
}

export abstract class BuyNowProvider {
  abstract createCheckoutSession(
    params: BuyNowCheckoutParams,
    ctx: BuyNowProviderContext,
  ): Promise<BuyNowCheckoutResult>;
}

@Injectable()
export class FakeBuyNowProvider extends BuyNowProvider {
  private readonly logger = new Logger(FakeBuyNowProvider.name);

  async createCheckoutSession(
    params: BuyNowCheckoutParams,
    _ctx?: BuyNowProviderContext,
  ): Promise<BuyNowCheckoutResult> {
    void _ctx;
    const sessionId = `fake_${Date.now()}`;
    const sessionUrl = `https://example.test/checkout/${sessionId}`;

    this.logger.log(
      `Created fake checkout session for plan ${params.plan.planCode}`,
    );

    return {
      provider: "fake",
      sessionId,
      sessionUrl,
    };
  }
}

