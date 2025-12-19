import {
  createBuyNowProvider,
  createBillingWebhookProvider,
} from "../providers/provider.factory";
import { StripeBuyNowProvider } from "../providers/stripe-buy-now.provider";
import { StripeBillingWebhookProvider } from "../providers/stripe-billing-webhook.provider";
import { FakeBuyNowProvider } from "../buy-now.provider";
import { FakeBillingWebhookProvider } from "../billing-webhook.provider";

const baseConfig = {
  stripe: { secretKey: "sk_test_123", webhookSecretSnapshot: "whsec_test" },
  goCardless: {},
};

describe("provider factory", () => {
  it("creates Stripe providers when active is STRIPE", () => {
    const config = { ...baseConfig, activeProvider: "STRIPE" } as const;
    expect(createBuyNowProvider(config)).toBeInstanceOf(StripeBuyNowProvider);
    expect(createBillingWebhookProvider(config)).toBeInstanceOf(
      StripeBillingWebhookProvider,
    );
  });

  it("creates GoCardless providers when active is GOCARDLESS", () => {
    const config = { ...baseConfig, activeProvider: "GOCARDLESS" } as const;
    expect(createBuyNowProvider(config)).toBeInstanceOf(FakeBuyNowProvider);
    expect(createBillingWebhookProvider(config)).toBeInstanceOf(
      FakeBillingWebhookProvider,
    );
  });

  it("creates fake providers by default", () => {
    const config = { ...baseConfig, activeProvider: "FAKE" } as const;
    expect(createBuyNowProvider(config)).toBeInstanceOf(FakeBuyNowProvider);
    expect(createBillingWebhookProvider(config)).toBeInstanceOf(
      FakeBillingWebhookProvider,
    );
  });
});

