import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { PathwayAuthGuard } from "@pathway/auth";
import { BillingPricingService, type BillingPricesResponse } from "./pricing.service";

@UseGuards(PathwayAuthGuard)
@Controller("billing/prices")
export class BillingPricingController {
  constructor(private readonly pricing: BillingPricingService) {}

  @Get()
  async list(
    @Query("refresh") refresh?: string,
  ): Promise<BillingPricesResponse> {
    const force = refresh === "true";
    return this.pricing.listPrices(force);
  }
}

