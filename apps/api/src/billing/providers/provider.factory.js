import { FakeBuyNowProvider } from "../buy-now.provider";
import { FakeBillingWebhookProvider } from "../billing-webhook.provider";
import { StripeBuyNowProvider } from "./stripe-buy-now.provider";
import { StripeBillingWebhookProvider } from "./stripe-billing-webhook.provider";
export function createBuyNowProvider(config) {
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
export function createBillingWebhookProvider(config) {
    switch (config.activeProvider) {
        case "STRIPE":
            if (!config.stripe.secretKey ||
                !config.stripe.webhookSecretSnapshot) {
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
export function isRealProvider(active) {
    return active === "STRIPE" || active === "GOCARDLESS";
}
