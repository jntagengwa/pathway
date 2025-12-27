/**
 * Plan information and pricing mapping
 * 
 * Maps plan codes to human-readable labels and pricing information.
 * Keep in sync with backend plan catalogue (Epic 8).
 */

export type PlanInfo = {
  code: string;
  tier: "starter" | "growth" | "enterprise";
  interval: "monthly" | "yearly";
  displayName: string;
  priceDisplay: string;
  av30Included: number | null;
  // TODO: Add actual pricing when wired from backend or Stripe
  priceInPounds?: number | null;
};

/**
 * Plan catalogue mapping
 * 
 * TODO: Wire from backend /billing/prices endpoint or plan catalogue
 * For now, using placeholder values for display purposes
 */
export const PLAN_CATALOGUE: Record<string, PlanInfo> = {
  STARTER_MONTHLY: {
    code: "STARTER_MONTHLY",
    tier: "starter",
    interval: "monthly",
    displayName: "Starter (Monthly)",
    priceDisplay: "£49 per month",
    av30Included: 50,
    priceInPounds: 49,
  },
  STARTER_YEARLY: {
    code: "STARTER_YEARLY",
    tier: "starter",
    interval: "yearly",
    displayName: "Starter (Yearly)",
    priceDisplay: "£490 per year",
    av30Included: 50,
    priceInPounds: 490,
  },
  GROWTH_MONTHLY: {
    code: "GROWTH_MONTHLY",
    tier: "growth",
    interval: "monthly",
    displayName: "Growth (Monthly)",
    priceDisplay: "£149 per month",
    av30Included: 200,
    priceInPounds: 149,
  },
  GROWTH_YEARLY: {
    code: "GROWTH_YEARLY",
    tier: "growth",
    interval: "yearly",
    displayName: "Growth (Yearly)",
    priceDisplay: "£1,490 per year",
    av30Included: 200,
    priceInPounds: 1490,
  },
  ENTERPRISE_CONTACT: {
    code: "ENTERPRISE_CONTACT",
    tier: "enterprise",
    interval: "yearly",
    displayName: "Enterprise",
    priceDisplay: "Contact us for pricing",
    av30Included: null,
    priceInPounds: null,
  },
};

/**
 * Get plan information from plan code
 */
export function getPlanInfo(planCode?: string | null): PlanInfo | null {
  if (!planCode) return null;
  return PLAN_CATALOGUE[planCode] ?? null;
}

/**
 * Get display name for a plan
 */
export function getPlanDisplayName(planCode?: string | null): string {
  const info = getPlanInfo(planCode);
  return info?.displayName ?? planCode ?? "Unknown plan";
}

/**
 * Get price display for a plan
 */
export function getPlanPriceDisplay(planCode?: string | null): string {
  const info = getPlanInfo(planCode);
  return info?.priceDisplay ?? "See pricing";
}

/**
 * Format a date as a friendly renewal date
 */
export function formatRenewalDate(dateString?: string | null): string {
  if (!dateString) return "Not available";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Not available";
  
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

