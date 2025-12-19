import { FakeBuyNowProvider } from "../buy-now.provider";
import { FakeBillingWebhookProvider } from "../billing-webhook.provider";
import { StripeBuyNowProvider } from "./stripe-buy-now.provider";
import { StripeBillingWebhookProvider } from "./stripe-billing-webhook.provider";
import type {
  BillingProviderConfig,
  ActiveBillingProvider,
} from "../billing-provider.config";
import type { BuyNowProvider } from "../buy-now.provider";
import type { BillingWebhookProvider } from "../billing-webhook.provider";

export function createBuyNowProvider(
  config: BillingProviderConfig,
): BuyNowProvider {
  switch (config.activeProvider) {
    case "STRIPE":
      if (!config.stripe.secretKey) {
        return new FakeBuyNowProvider();
      }
      return new StripeBuyNowProvider(config);
    case "GOCARDLESS":
      // GoCardless temporarily disabled: fallback to fake provider.
      return new FakeBuyNowProvider();
    case "FAKE":
    default:
      return new FakeBuyNowProvider();
  }
}

export function createBillingWebhookProvider(
  config: BillingProviderConfig,
): BillingWebhookProvider {
  switch (config.activeProvider) {
    case "STRIPE":
      if (!config.stripe.secretKey || !config.stripe.webhookSecret) {
        return new FakeBillingWebhookProvider();
      }
      return new StripeBillingWebhookProvider(config);
    case "GOCARDLESS":
      // GoCardless temporarily disabled: fallback to fake provider.
      return new FakeBillingWebhookProvider();
    case "FAKE":
    default:
      return new FakeBillingWebhookProvider();
  }
}

export function isRealProvider(active: ActiveBillingProvider): boolean {
  return active === "STRIPE" || active === "GOCARDLESS";
}

