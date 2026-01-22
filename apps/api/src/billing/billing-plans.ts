// Plan catalogue derived from Option A spec (`pathway-buy-now-option-a.md`).
// Keep PlanCode values in sync with Subscription.planCode and Buy Now flow inputs.
export type PlanTier = "core" | "starter" | "growth" | "enterprise";

export type PlanCode =
  | "CORE_MONTHLY"
  | "CORE_YEARLY"
  | "MINIMUM_MONTHLY" // Stripe alias for CORE_MONTHLY
  | "MINIMUM_YEARLY" // Stripe alias for CORE_YEARLY
  | "STARTER_MONTHLY"
  | "STARTER_YEARLY"
  | "GROWTH_MONTHLY"
  | "GROWTH_YEARLY"
  | "ENTERPRISE_CONTACT";

export type PlanDefinition = {
  code: PlanCode;
  tier: PlanTier;
  displayName: string;
  billingPeriod: "monthly" | "yearly" | "none";
  selfServe: boolean;
  av30Included: number | null;
  storageGbIncluded: number | null;
  smsMessagesIncluded: number | null;
  leaderSeatsIncluded: number | null;
  maxSitesIncluded: number | null;
  flags?: { canExceedAv30WithOverage?: boolean; enterpriseOnly?: boolean };
};

export const PLAN_CATALOGUE: Readonly<Record<PlanCode, PlanDefinition>> = {
  CORE_MONTHLY: {
    code: "CORE_MONTHLY",
    tier: "core",
    displayName: "Core",
    billingPeriod: "monthly",
    selfServe: true,
    av30Included: 15,
    storageGbIncluded: null,
    smsMessagesIncluded: null,
    leaderSeatsIncluded: null,
    maxSitesIncluded: 1,
  },
  CORE_YEARLY: {
    code: "CORE_YEARLY",
    tier: "core",
    displayName: "Core",
    billingPeriod: "yearly",
    selfServe: true,
    av30Included: 15,
    storageGbIncluded: null,
    smsMessagesIncluded: null,
    leaderSeatsIncluded: null,
    maxSitesIncluded: 1,
  },
  MINIMUM_MONTHLY: {
    code: "MINIMUM_MONTHLY",
    tier: "core",
    displayName: "Core",
    billingPeriod: "monthly",
    selfServe: true,
    av30Included: 15,
    storageGbIncluded: null,
    smsMessagesIncluded: null,
    leaderSeatsIncluded: null,
    maxSitesIncluded: 1,
  },
  MINIMUM_YEARLY: {
    code: "MINIMUM_YEARLY",
    tier: "core",
    displayName: "Core",
    billingPeriod: "yearly",
    selfServe: true,
    av30Included: 15,
    storageGbIncluded: null,
    smsMessagesIncluded: null,
    leaderSeatsIncluded: null,
    maxSitesIncluded: 1,
  },
  STARTER_MONTHLY: {
    code: "STARTER_MONTHLY",
    tier: "starter",
    displayName: "Starter",
    billingPeriod: "monthly",
    selfServe: true,
    av30Included: 50, // Option A: Starter includes 50 Active People (AV30).
    storageGbIncluded: null, // Option A does not define storage included for Starter.
    smsMessagesIncluded: null, // Option A does not define SMS included for Starter.
    leaderSeatsIncluded: null, // Option A does not define leader seats; keep null until specified.
    maxSitesIncluded: 1, // Option A: Starter includes 1 site.
  },
  STARTER_YEARLY: {
    code: "STARTER_YEARLY",
    tier: "starter",
    displayName: "Starter",
    billingPeriod: "yearly",
    selfServe: true,
    av30Included: 50,
    storageGbIncluded: null,
    smsMessagesIncluded: null,
    leaderSeatsIncluded: null,
    maxSitesIncluded: 1,
  },
  GROWTH_MONTHLY: {
    code: "GROWTH_MONTHLY",
    tier: "growth",
    displayName: "Growth",
    billingPeriod: "monthly",
    selfServe: true,
    av30Included: 200, // Option A: Growth includes 200 Active People (AV30).
    storageGbIncluded: null, // Option A does not define storage included for Growth.
    smsMessagesIncluded: null, // Option A does not define SMS included for Growth.
    leaderSeatsIncluded: null, // Option A does not define leader seats; keep null until specified.
    maxSitesIncluded: 3, // Option A: Growth includes 3 sites.
  },
  GROWTH_YEARLY: {
    code: "GROWTH_YEARLY",
    tier: "growth",
    displayName: "Growth",
    billingPeriod: "yearly",
    selfServe: true,
    av30Included: 200,
    storageGbIncluded: null,
    smsMessagesIncluded: null,
    leaderSeatsIncluded: null,
    maxSitesIncluded: 3,
  },
  ENTERPRISE_CONTACT: {
    code: "ENTERPRISE_CONTACT",
    tier: "enterprise",
    displayName: "Enterprise (contact us)",
    billingPeriod: "none",
    selfServe: false,
    av30Included: null, // Enterprise is bespoke; caps set per contract/snapshot.
    storageGbIncluded: null,
    smsMessagesIncluded: null,
    leaderSeatsIncluded: null,
    maxSitesIncluded: null,
    flags: { enterpriseOnly: true },
  },
};

export function getPlanDefinition(
  planCode: string | null | undefined,
): PlanDefinition | null {
  if (!planCode) return null;
  if (planCode in PLAN_CATALOGUE) {
    return PLAN_CATALOGUE[planCode as PlanCode];
  }
  return null;
}

