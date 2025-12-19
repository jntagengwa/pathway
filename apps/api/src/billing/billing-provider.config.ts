import { BillingProvider } from "@pathway/db";
import { PLAN_CATALOGUE, type PlanCode } from "./billing-plans";

export type ActiveBillingProvider = "FAKE" | "STRIPE" | "GOCARDLESS";

export type StripePriceMap = Partial<Record<PlanCode, string>>;

export type BillingProviderConfig = {
  activeProvider: ActiveBillingProvider;
  stripe: {
    secretKey?: string;
    webhookSecretSnapshot?: string;
    webhookSecretThin?: string;
    priceMap?: StripePriceMap;
    successUrlDefault?: string;
    cancelUrlDefault?: string;
  };
  goCardless: {
    accessToken?: string;
    webhookSecret?: string;
    environment?: "sandbox" | "live";
    baseUrl?: string;
    successUrlDefault?: string;
    cancelUrlDefault?: string;
  };
};

export const BILLING_PROVIDER_CONFIG = Symbol("BILLING_PROVIDER_CONFIG");

const isProd = process.env.NODE_ENV === "production";

const parsePriceMap = (raw?: string): StripePriceMap | undefined => {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const filtered: StripePriceMap = {};
    Object.keys(parsed).forEach((code) => {
      if (code in PLAN_CATALOGUE) {
        filtered[code as PlanCode] = parsed[code];
      }
    });
    return filtered;
  } catch {
    return undefined;
  }
};

export function loadBillingProviderConfig(): BillingProviderConfig {
  const active = (process.env.BILLING_PROVIDER?.toUpperCase() ??
    "FAKE") as ActiveBillingProvider;
  const fallbackSuccess = process.env.BILLING_SUCCESS_URL_DEFAULT ??
    "http://localhost:3000/billing/checkout/success";
  const fallbackCancel = process.env.BILLING_CANCEL_URL_DEFAULT ??
    "http://localhost:3000/billing/checkout/cancel";

  const stripeConfig = {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecretSnapshot: process.env.STRIPE_WEBHOOK_SECRET_SNAPSHOT,
    webhookSecretThin: process.env.STRIPE_WEBHOOK_SECRET_THIN,
    priceMap: parsePriceMap(process.env.STRIPE_PRICE_MAP),
    successUrlDefault: process.env.STRIPE_SUCCESS_URL ?? fallbackSuccess,
    cancelUrlDefault: process.env.STRIPE_CANCEL_URL ?? fallbackCancel,
  };

  const goCardlessEnv =
    process.env.GOCARDLESS_ENV === "live"
      ? "live"
      : process.env.GOCARDLESS_ENV === "sandbox"
        ? "sandbox"
        : undefined;

  const goCardlessConfig: BillingProviderConfig["goCardless"] = {
    accessToken: process.env.GOCARDLESS_ACCESS_TOKEN,
    webhookSecret: process.env.GOCARDLESS_WEBHOOK_SECRET,
    environment: goCardlessEnv,
    baseUrl: process.env.GOCARDLESS_BASE_URL,
    successUrlDefault: process.env.GOCARDLESS_SUCCESS_URL ?? fallbackSuccess,
    cancelUrlDefault: process.env.GOCARDLESS_CANCEL_URL ?? fallbackCancel,
  };

  if (active === "STRIPE" && isProd) {
    if (!stripeConfig.secretKey || !stripeConfig.webhookSecretSnapshot) {
      throw new Error(
        "Stripe billing provider requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET_SNAPSHOT in production",
      );
    }
  }

  if (active === "GOCARDLESS" && isProd) {
    if (!goCardlessConfig.accessToken || !goCardlessConfig.webhookSecret) {
      throw new Error(
        "GoCardless billing provider requires GOCARDLESS_ACCESS_TOKEN and GOCARDLESS_WEBHOOK_SECRET in production",
      );
    }
  }

  const safeActive: ActiveBillingProvider =
    active === "STRIPE" || active === "GOCARDLESS" ? active : "FAKE";

  // Temporarily disable GoCardless until implementation is ready.
  const effectiveActive: ActiveBillingProvider =
    safeActive === "GOCARDLESS" ? "FAKE" : safeActive;

  return {
    activeProvider: effectiveActive,
    stripe: stripeConfig,
    goCardless: goCardlessConfig,
  };
}

export function activeProviderToPrismaProvider(
  active: ActiveBillingProvider,
): BillingProvider {
  if (active === "GOCARDLESS") {
    return BillingProvider.GOCARDLESS;
  }
  // Map FAKE to STRIPE for persisted enum compatibility.
  return BillingProvider.STRIPE;
}

