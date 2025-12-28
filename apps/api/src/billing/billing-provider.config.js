import { BillingProvider } from "@pathway/db";
export const BILLING_PROVIDER_CONFIG = Symbol("BILLING_PROVIDER_CONFIG");
const isProd = process.env.NODE_ENV === "production";
const ALLOWED_PRICE_CODES = new Set([
    "STARTER_MONTHLY",
    "STARTER_YEARLY",
    "GROWTH_MONTHLY",
    "GROWTH_YEARLY",
    "ENTERPRISE_CONTACT",
    "AV30_BLOCK_25_MONTHLY",
    "AV30_BLOCK_25_YEARLY",
    "AV30_BLOCK_50_MONTHLY",
    "AV30_BLOCK_50_YEARLY",
    "STORAGE_100GB_YEARLY",
    "STORAGE_200GB_YEARLY",
    "STORAGE_1TB_YEARLY",
    "SMS_1000_MONTHLY",
    "SMS_1000_YEARLY",
]);
const parsePriceMap = (raw) => {
    if (!raw)
        return undefined;
    try {
        const parsed = JSON.parse(raw);
        const filtered = {};
        Object.keys(parsed).forEach((code) => {
            // Normalise keys to uppercase and map legacy names to current codes
            const upper = code.toUpperCase();
            const legacyMap = {
                STARTER_MONTH: "STARTER_MONTHLY",
                STARTER_YEAR: "STARTER_YEARLY",
                GROWTH_MONTH: "GROWTH_MONTHLY",
                GROWTH_YEAR: "GROWTH_YEARLY",
                ADDON_AV30_25_MONTH: "AV30_BLOCK_25_MONTHLY",
                ADDON_AV30_25_YEAR: "AV30_BLOCK_25_YEARLY",
                ADDON_AV30_50_MONTH: "AV30_BLOCK_50_MONTHLY",
                ADDON_AV30_50_YEAR: "AV30_BLOCK_50_YEARLY",
                ADDON_STORAGE_100GB_YEAR: "STORAGE_100GB_YEARLY",
                ADDON_STORAGE_200GB_YEAR: "STORAGE_200GB_YEARLY",
                ADDON_STORAGE_1TB_YEAR: "STORAGE_1TB_YEARLY",
                ADDON_SMS_1000_MONTH: "SMS_1000_MONTHLY",
                ADDON_SMS_1000_YEAR: "SMS_1000_YEARLY",
            };
            const mapped = (legacyMap[upper] ?? upper);
            if (ALLOWED_PRICE_CODES.has(mapped)) {
                filtered[mapped] = parsed[code];
            }
        });
        return filtered;
    }
    catch {
        return undefined;
    }
};
export function loadBillingProviderConfig() {
    const active = (process.env.BILLING_PROVIDER?.toUpperCase() ??
        "FAKE");
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
    const goCardlessEnv = process.env.GOCARDLESS_ENV === "live"
        ? "live"
        : process.env.GOCARDLESS_ENV === "sandbox"
            ? "sandbox"
            : undefined;
    const goCardlessConfig = {
        accessToken: process.env.GOCARDLESS_ACCESS_TOKEN,
        webhookSecret: process.env.GOCARDLESS_WEBHOOK_SECRET,
        environment: goCardlessEnv,
        baseUrl: process.env.GOCARDLESS_BASE_URL,
        successUrlDefault: process.env.GOCARDLESS_SUCCESS_URL ?? fallbackSuccess,
        cancelUrlDefault: process.env.GOCARDLESS_CANCEL_URL ?? fallbackCancel,
    };
    if (active === "STRIPE" && isProd) {
        if (!stripeConfig.secretKey || !stripeConfig.webhookSecretSnapshot) {
            throw new Error("Stripe billing provider requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET_SNAPSHOT in production");
        }
    }
    if (active === "GOCARDLESS" && isProd) {
        if (!goCardlessConfig.accessToken || !goCardlessConfig.webhookSecret) {
            throw new Error("GoCardless billing provider requires GOCARDLESS_ACCESS_TOKEN and GOCARDLESS_WEBHOOK_SECRET in production");
        }
    }
    const safeActive = active === "STRIPE" || active === "GOCARDLESS" ? active : "FAKE";
    // Temporarily disable GoCardless until implementation is ready.
    const effectiveActive = safeActive === "GOCARDLESS" ? "FAKE" : safeActive;
    return {
        activeProvider: effectiveActive,
        stripe: stripeConfig,
        goCardless: goCardlessConfig,
    };
}
export function activeProviderToPrismaProvider(active) {
    if (active === "GOCARDLESS") {
        return BillingProvider.GOCARDLESS;
    }
    // Map FAKE to STRIPE for persisted enum compatibility.
    return BillingProvider.STRIPE;
}
