import { loadBillingProviderConfig } from "../billing-provider.config";

const originalEnv = { ...process.env };

describe("billing provider config", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("defaults to FAKE when env is missing and Stripe keys absent", () => {
    delete process.env.BILLING_PROVIDER;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET_SNAPSHOT;
    const config = loadBillingProviderConfig();
    expect(config.activeProvider).toBe("FAKE");
  });

  it("loads STRIPE config and price map when env is set", () => {
    process.env.BILLING_PROVIDER = "STRIPE";
    process.env.STRIPE_SECRET_KEY = "sk_test";
    process.env.STRIPE_WEBHOOK_SECRET_SNAPSHOT = "whsec_snapshot";
    process.env.STRIPE_PRICE_MAP =
      '{"STARTER_MONTHLY":"price_starter_m","GROWTH_MONTHLY":"price_growth_m"}';
    const config = loadBillingProviderConfig();
    expect(config.activeProvider).toBe("STRIPE");
    expect(config.stripe.priceMap?.STARTER_MONTHLY).toBe("price_starter_m");
    expect(config.stripe.webhookSecretSnapshot).toBe("whsec_snapshot");
  });

  it("uses STRIPE when BILLING_PROVIDER unset but Stripe keys present (fallback)", () => {
    delete process.env.BILLING_PROVIDER;
    process.env.STRIPE_SECRET_KEY = "sk_live_xxx";
    process.env.STRIPE_WEBHOOK_SECRET_SNAPSHOT = "whsec_live";
    const config = loadBillingProviderConfig();
    expect(config.activeProvider).toBe("STRIPE");
  });

  it("stays FAKE when BILLING_PROVIDER unset and Stripe keys missing", () => {
    delete process.env.BILLING_PROVIDER;
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_WEBHOOK_SECRET_SNAPSHOT;
    const config = loadBillingProviderConfig();
    expect(config.activeProvider).toBe("FAKE");
  });
});

