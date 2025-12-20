import { BillingPricingService } from "../pricing.service";
import type { BillingProviderConfig } from "../billing-provider.config";

describe("BillingPricingService", () => {
  it("returns fake provider when stripe secret missing", async () => {
    const config: BillingProviderConfig = {
      activeProvider: "FAKE",
      stripe: { priceMap: { STARTER_MONTHLY: "price_dummy" } },
      goCardless: {},
    };

    const service = new BillingPricingService(config);
    const result = await service.listPrices();
    expect(result.provider).toBe("fake");
    expect(result.prices).toEqual([]);
    expect(result.warnings).toContain("pricing_unavailable");
  });
});

