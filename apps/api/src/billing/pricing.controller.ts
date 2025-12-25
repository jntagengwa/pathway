import { Controller, Get, Query, UseGuards, Inject } from "@nestjs/common";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { BillingPricingService, type BillingPricesResponse } from "./pricing.service";

@UseGuards(AuthUserGuard)
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

