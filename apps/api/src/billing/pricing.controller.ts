import { Controller, Get, Query, Inject } from "@nestjs/common";
import { BillingPricingService, type BillingPricesResponse } from "./pricing.service";

/**
 * Public pricing endpoint for marketing site and buy-now flow.
 * No authentication required - prices are publicly available.
 */
@Controller("billing/prices")
export class BillingPricingController {
  constructor(@Inject(BillingPricingService) private readonly pricing: BillingPricingService) {}

  @Get()
  async list(
    @Query("refresh") refresh?: string,
  ): Promise<BillingPricesResponse> {
    const force = refresh === "true";
    return this.pricing.listPrices(force);
  }
}

