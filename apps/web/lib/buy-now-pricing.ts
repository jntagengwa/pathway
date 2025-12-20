/**
 * Frontend-only Stripe price metadata for the public Buy Now flow.
 * This maps plan/add-on codes to Stripe price ids and display amounts.
 * Billing authority remains on the backend (Stripe + snapshot webhooks),
 * so keep these codes consistent with `apps/api/src/billing/billing-plans.ts`.
 */

export type BillingInterval = "month" | "year";

export type PlanCode =
  | "STARTER_MONTHLY"
  | "STARTER_YEARLY"
  | "GROWTH_MONTHLY"
  | "GROWTH_YEARLY";

export type AddonCode =
  | "AV30_BLOCK_25_MONTHLY"
  | "AV30_BLOCK_25_YEARLY"
  | "AV30_BLOCK_50_MONTHLY"
  | "AV30_BLOCK_50_YEARLY"
  | "STORAGE_100GB_YEARLY"
  | "STORAGE_200GB_YEARLY"
  | "STORAGE_1TB_YEARLY"
  | "SMS_1000_MONTHLY"
  | "SMS_1000_YEARLY";

export type StripePriceMeta = {
  stripePriceId: string;
  amountMajor: number; // e.g. 149 => £149
  currency: "gbp";
  interval: BillingInterval;
  label: string;
};

export const PLAN_PRICES: Record<PlanCode, StripePriceMeta> = {
  STARTER_MONTHLY: {
    stripePriceId: "price_starter_monthly",
    amountMajor: 149,
    currency: "gbp",
    interval: "month",
    label: "£149 / month",
  },
  STARTER_YEARLY: {
    stripePriceId: "price_starter_annual",
    amountMajor: 1490,
    currency: "gbp",
    interval: "year",
    label: "£1,490 / year",
  },
  GROWTH_MONTHLY: {
    stripePriceId: "price_growth_monthly",
    amountMajor: 399,
    currency: "gbp",
    interval: "month",
    label: "£399 / month",
  },
  GROWTH_YEARLY: {
    stripePriceId: "price_growth_annual",
    amountMajor: 3990,
    currency: "gbp",
    interval: "year",
    label: "£3,990 / year",
  },
};

export const ADDON_PRICES: Record<AddonCode, StripePriceMeta> = {
  AV30_BLOCK_25_MONTHLY: {
    stripePriceId: "price_av30_25_monthly",
    amountMajor: 39,
    currency: "gbp",
    interval: "month",
    label: "+25 Active People — £39 / month",
  },
  AV30_BLOCK_25_YEARLY: {
    stripePriceId: "price_av30_25_annual",
    amountMajor: 390,
    currency: "gbp",
    interval: "year",
    label: "+25 Active People — £390 / year",
  },
  AV30_BLOCK_50_MONTHLY: {
    stripePriceId: "price_av30_50_monthly",
    amountMajor: 59,
    currency: "gbp",
    interval: "month",
    label: "+50 Active People — £59 / month",
  },
  AV30_BLOCK_50_YEARLY: {
    stripePriceId: "price_av30_50_annual",
    amountMajor: 590,
    currency: "gbp",
    interval: "year",
    label: "+50 Active People — £590 / year",
  },
  STORAGE_100GB_YEARLY: {
    stripePriceId: "price_storage_100gb_annual",
    amountMajor: 250,
    currency: "gbp",
    interval: "year",
    label: "+100GB storage — £250 / year",
  },
  STORAGE_200GB_YEARLY: {
    stripePriceId: "price_storage_200gb_annual",
    amountMajor: 450,
    currency: "gbp",
    interval: "year",
    label: "+200GB storage — £450 / year",
  },
  STORAGE_1TB_YEARLY: {
    stripePriceId: "price_storage_1tb_annual",
    amountMajor: 1500,
    currency: "gbp",
    interval: "year",
    label: "+1TB storage — £1,500 / year",
  },
  SMS_1000_MONTHLY: {
    stripePriceId: "price_sms_1000_monthly",
    amountMajor: 15,
    currency: "gbp",
    interval: "month",
    label: "1,000 SMS — £15 / month",
  },
  SMS_1000_YEARLY: {
    stripePriceId: "price_sms_1000_annual",
    amountMajor: 150,
    currency: "gbp",
    interval: "year",
    label: "1,000 SMS — £150 / year",
  },
};

export type BuyNowSelection = {
  planCode: PlanCode;
  frequency: "monthly" | "yearly";
  av30AddonBlocks25?: number;
  av30AddonBlocks50?: number;
  storageAddon100Gb?: number;
  storageAddon200Gb?: number;
  storageAddon1Tb?: number;
  smsBundles1000?: number;
};

export type CartTotals = {
  currency: "gbp";
  subtotalMajor: number;
  totalMajor: number;
  lines: { label: string; amountMajor: number }[];
};

export function calculateCartTotals(
  selection: BuyNowSelection,
  opts?: {
    planPrices?: Partial<Record<PlanCode, StripePriceMeta>>;
    addonPrices?: Partial<
      Record<AddonCode, { stripePriceId?: string; amountMajor: number; label: string }>
    >;
  },
): CartTotals {
  const lines: CartTotals["lines"] = [];

  const planPrices = { ...PLAN_PRICES, ...(opts?.planPrices ?? {}) };
  const planMeta = planPrices[selection.planCode];
  if (planMeta) {
    lines.push({ label: planMeta.label, amountMajor: planMeta.amountMajor });
  }

  const addLine = (
    label: string,
    unit: StripePriceMeta | undefined,
    quantity: number | undefined,
  ) => {
    if (!unit) return;
    const qty = Math.max(0, Math.trunc(quantity ?? 0));
    if (!qty) return;
    lines.push({
      label: `${label} × ${qty}`,
      amountMajor: unit.amountMajor * qty,
    });
  };

  const intervalKey = selection.frequency === "yearly" ? "YEARLY" : "MONTHLY";
  const addonPrices = { ...ADDON_PRICES, ...(opts?.addonPrices ?? {}) };

  addLine(
    "+25 Active People",
    addonPrices[`AV30_BLOCK_25_${intervalKey}` as AddonCode],
    selection.av30AddonBlocks25,
  );
  addLine(
    "+50 Active People",
    addonPrices[`AV30_BLOCK_50_${intervalKey}` as AddonCode],
    selection.av30AddonBlocks50,
  );
  addLine(
    "+100GB storage",
    addonPrices[`STORAGE_100GB_${intervalKey}` as AddonCode],
    selection.storageAddon100Gb,
  );
  addLine(
    "+200GB storage",
    addonPrices[`STORAGE_200GB_${intervalKey}` as AddonCode],
    selection.storageAddon200Gb,
  );
  addLine(
    "+1TB storage",
    addonPrices[`STORAGE_1TB_${intervalKey}` as AddonCode],
    selection.storageAddon1Tb,
  );
  addLine(
    "1,000 SMS",
    addonPrices[`SMS_1000_${intervalKey}` as AddonCode],
    selection.smsBundles1000,
  );

  const subtotalMajor = lines.reduce((sum, line) => sum + line.amountMajor, 0);

  return {
    currency: "gbp",
    subtotalMajor,
    totalMajor: subtotalMajor,
    lines,
  };
}

export function mergeBillingPrices(
  prices: { code: string; unitAmount: number; interval: "month" | "year" | null }[],
): {
  planPrices: Partial<Record<PlanCode, StripePriceMeta>>;
  addonPrices: Partial<Record<AddonCode, { amountMajor: number; label: string; stripePriceId?: string }>>;
} {
  const planPrices: Partial<Record<PlanCode, StripePriceMeta>> = {};
  const addonPrices: Partial<
    Record<AddonCode, { amountMajor: number; label: string; stripePriceId?: string }>
  > = {};

  prices.forEach((p) => {
    const amountMajor = typeof p.unitAmount === "number" ? Math.round(p.unitAmount / 100) : 0;
    if (!amountMajor) return;
    const interval = p.interval ?? "month";

    if (
      p.code === "STARTER_MONTHLY" ||
      p.code === "STARTER_YEARLY" ||
      p.code === "GROWTH_MONTHLY" ||
      p.code === "GROWTH_YEARLY"
    ) {
      planPrices[p.code as PlanCode] = {
        stripePriceId: "",
        amountMajor,
        currency: "gbp",
        interval,
        label: `£${amountMajor.toLocaleString("en-GB")} / ${interval === "month" ? "month" : "year"}`,
      };
      return;
    }

    const addonKey = p.code as AddonCode;
    if (addonKey in ADDON_PRICES) {
      addonPrices[addonKey] = {
        amountMajor,
        stripePriceId: "",
        label: ADDON_PRICES[addonKey].label.replace(
          /£[\d,]+/,
          `£${amountMajor.toLocaleString("en-GB")}`,
        ),
      };
    }
  });

  return { planPrices, addonPrices };
}

