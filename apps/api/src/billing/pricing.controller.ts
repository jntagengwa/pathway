import { Controller, Get, Query, Inject } from "@nestjs/common";
import { BillingPricingService, type BillingPricesResponse } from "./pricing.service";
import {
  BILLING_PROVIDER_CONFIG,
  type BillingProviderConfig,
} from "./billing-provider.config";

/** Redact Stripe price IDs for safe logging/preview (e.g. price_xxx -> price_***). */
function redactPriceIds(raw: string, maxLength: number): string {
  const redacted = raw.replace(/price_[a-zA-Z0-9_]+/gi, "price_***");
  return redacted.length > maxLength ? redacted.slice(0, maxLength) + "…" : redacted;
}

export type BillingPricingDiagnostics = {
  activeProvider: string;
  stripeClient: boolean;
  priceMapSet: boolean;
  priceMapRawLength: number;
  /** First ~200 chars of STRIPE_PRICE_MAP with price IDs redacted; safe to expose in prod. */
  priceMapRawPreview: string | null;
  priceMapParseSuccess: boolean;
  priceMapParseError?: string;
  priceMapKeysExtracted: string[];
  /** Where pricing fails: ok, no_stripe_client, no_price_map */
  failurePoint: "ok" | "no_stripe_client" | "no_price_map";
};

/**
 * Public pricing endpoint for marketing site and buy-now flow.
 * No authentication required - prices are publicly available.
 */
@Controller("billing/prices")
export class BillingPricingController {
  constructor(
    @Inject(BillingPricingService) private readonly pricing: BillingPricingService,
    @Inject(BILLING_PROVIDER_CONFIG) private readonly config: BillingProviderConfig,
  ) {}

  @Get()
  async list(
    @Query("refresh") refresh?: string,
  ): Promise<BillingPricesResponse> {
    const force = refresh === "true";
    return this.pricing.listPrices(force);
  }

  /**
   * Safe billing/pricing diagnostics for prod debugging.
   * Exposes STRIPE_PRICE_MAP structure (redacted) and parse result; no secret values.
   */
  @Get("diagnostics")
  getDiagnostics(): BillingPricingDiagnostics {
    const stripe = this.config.stripe;
    const diag = stripe.priceMapDiagnostics;
    const rawEnv =
      this.config.activeProvider === "STRIPE_TEST"
        ? (process.env.STRIPE_PRICE_MAP_TEST ?? process.env.STRIPE_PRICE_MAP)
        : process.env.STRIPE_PRICE_MAP;
    const rawPreview =
      rawEnv && typeof rawEnv === "string"
        ? redactPriceIds(rawEnv.trim().replace(/^\uFEFF/, ""), 220)
        : null;

    const hasStripeClient = Boolean(
      this.config.stripe.secretKey && this.config.activeProvider !== "FAKE",
    );
    const hasPriceMap = Boolean(stripe.priceMap && Object.keys(stripe.priceMap).length > 0);
    const failurePoint: BillingPricingDiagnostics["failurePoint"] = !hasStripeClient
      ? "no_stripe_client"
      : !hasPriceMap
        ? "no_price_map"
        : "ok";

    return {
      activeProvider: this.config.activeProvider,
      stripeClient: hasStripeClient,
      priceMapSet: Boolean(diag?.rawSet),
      priceMapRawLength: diag?.rawLength ?? 0,
      priceMapRawPreview: rawPreview,
      priceMapParseSuccess: Boolean(diag?.parseSuccess),
      priceMapParseError: diag?.parseError,
      priceMapKeysExtracted: diag?.keysExtracted ?? [],
      failurePoint,
    };
  }
}

