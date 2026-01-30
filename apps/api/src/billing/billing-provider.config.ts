import { BillingProvider } from "@pathway/db";
import { type PlanCode } from "./billing-plans";

export type ActiveBillingProvider = "FAKE" | "STRIPE" | "STRIPE_TEST" | "GOCARDLESS";

export type AddonPriceCode =
  | "AV30_BLOCK_25_MONTHLY"
  | "AV30_BLOCK_25_YEARLY"
  | "AV30_BLOCK_50_MONTHLY"
  | "AV30_BLOCK_50_YEARLY"
  | "STORAGE_100GB_MONTHLY"
  | "STORAGE_100GB_YEARLY"
  | "STORAGE_200GB_MONTHLY"
  | "STORAGE_200GB_YEARLY"
  | "STORAGE_1TB_MONTHLY"
  | "STORAGE_1TB_YEARLY"
  | "SMS_1000_MONTHLY"
  | "SMS_1000_YEARLY";

export type PriceCode = PlanCode | AddonPriceCode;

export type StripePriceMap = Partial<Record<PriceCode, string>>;

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

const ALLOWED_PRICE_CODES: Set<PriceCode> = new Set([
  "STARTER_MONTHLY",
  "STARTER_YEARLY",
  "GROWTH_MONTHLY",
  "GROWTH_YEARLY",
  "ENTERPRISE_CONTACT",
  "AV30_BLOCK_25_MONTHLY",
  "AV30_BLOCK_25_YEARLY",
  "AV30_BLOCK_50_MONTHLY",
  "AV30_BLOCK_50_YEARLY",
  "STORAGE_100GB_MONTHLY",
  "STORAGE_100GB_YEARLY",
  "STORAGE_200GB_MONTHLY",
  "STORAGE_200GB_YEARLY",
  "STORAGE_1TB_MONTHLY",
  "STORAGE_1TB_YEARLY",
  "SMS_1000_MONTHLY",
  "SMS_1000_YEARLY",
]);

const parsePriceMap = (raw?: string): StripePriceMap | undefined => {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    const filtered: StripePriceMap = {};
    Object.keys(parsed).forEach((code) => {
      // Normalise keys to uppercase and map legacy names to current codes
      const upper = code.toUpperCase();
      const legacyMap: Record<string, PriceCode> = {
        STARTER_MONTH: "STARTER_MONTHLY",
        STARTER_YEAR: "STARTER_YEARLY",
        GROWTH_MONTH: "GROWTH_MONTHLY",
        GROWTH_YEAR: "GROWTH_YEARLY",
        ADDON_AV30_25_MONTH: "AV30_BLOCK_25_MONTHLY",
        ADDON_AV30_25_YEAR: "AV30_BLOCK_25_YEARLY",
        ADDON_AV30_50_MONTH: "AV30_BLOCK_50_MONTHLY",
        ADDON_AV30_50_YEAR: "AV30_BLOCK_50_YEARLY",
        ADDON_STORAGE_100GB_MONTH: "STORAGE_100GB_MONTHLY",
        ADDON_STORAGE_100GB_YEAR: "STORAGE_100GB_YEARLY",
        ADDON_STORAGE_200GB_MONTH: "STORAGE_200GB_MONTHLY",
        ADDON_STORAGE_200GB_YEAR: "STORAGE_200GB_YEARLY",
        ADDON_STORAGE_1TB_MONTH: "STORAGE_1TB_MONTHLY",
        ADDON_STORAGE_1TB_YEAR: "STORAGE_1TB_YEARLY",
        ADDON_SMS_1000_MONTH: "SMS_1000_MONTHLY",
        ADDON_SMS_1000_YEAR: "SMS_1000_YEARLY",
      };

      const mapped = (legacyMap[upper] ?? upper) as PriceCode;

      if (ALLOWED_PRICE_CODES.has(mapped)) {
        filtered[mapped] = parsed[code];
      }
    });
    return filtered;
  } catch {
    return undefined;
  }
};

export function loadBillingProviderConfig(): BillingProviderConfig {
  // Treat empty/whitespace as unset so we can apply production fallback
  const raw = process.env.BILLING_PROVIDER?.trim();
  const active = (raw?.toUpperCase() ?? "FAKE") as ActiveBillingProvider;
  const fallbackSuccess = process.env.BILLING_SUCCESS_URL_DEFAULT ??
    "http://localhost:3000/billing/checkout/success";
  const fallbackCancel = process.env.BILLING_CANCEL_URL_DEFAULT ??
    "http://localhost:3000/billing/checkout/cancel";

  // Use test keys and webhook secret when in STRIPE_TEST mode
  const isTestMode = active === "STRIPE_TEST";
  const secretKey = isTestMode
    ? (process.env.STRIPE_SECRET_KEY_TEST ?? process.env.STRIPE_SECRET_KEY)
    : process.env.STRIPE_SECRET_KEY;
  const webhookSecretSnapshot = isTestMode
    ? process.env.STRIPE_WEBHOOK_SECRET_TEST
    : process.env.STRIPE_WEBHOOK_SECRET_SNAPSHOT;
  const priceMapRaw = isTestMode
    ? (process.env.STRIPE_PRICE_MAP_TEST ?? process.env.STRIPE_PRICE_MAP)
    : process.env.STRIPE_PRICE_MAP;

  const stripeConfig = {
    secretKey,
    webhookSecretSnapshot,
    webhookSecretThin: process.env.STRIPE_WEBHOOK_SECRET_THIN,
    priceMap: parsePriceMap(priceMapRaw),
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

  const isProd = process.env.NODE_ENV === "production";
  if ((active === "STRIPE" || active === "STRIPE_TEST") && isProd) {
    if (!stripeConfig.secretKey || !stripeConfig.webhookSecretSnapshot) {
      const secretName = active === "STRIPE_TEST" 
        ? "STRIPE_WEBHOOK_SECRET_TEST" 
        : "STRIPE_WEBHOOK_SECRET_SNAPSHOT";
      throw new Error(
        `Stripe billing provider requires STRIPE_SECRET_KEY and ${secretName} in production`,
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
    active === "STRIPE" || active === "STRIPE_TEST" || active === "GOCARDLESS" 
      ? active 
      : "FAKE";

  // In production, if provider would be FAKE but Stripe keys are present, use STRIPE
  // so that setting Stripe secrets (without BILLING_PROVIDER) still enables Stripe.
  const prodStripeFallback =
    isProd &&
    safeActive === "FAKE" &&
    stripeConfig.secretKey &&
    stripeConfig.webhookSecretSnapshot;

  // Temporarily disable GoCardless until implementation is ready.
  const effectiveActive: ActiveBillingProvider = prodStripeFallback
    ? "STRIPE"
    : safeActive === "GOCARDLESS"
      ? "FAKE"
      : safeActive;

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

