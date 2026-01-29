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
  CORE_MONTHLY: {
    code: "CORE_MONTHLY",
    tier: "starter",
    interval: "monthly",
    displayName: "Core (Monthly)",
    priceDisplay: "£49.99 per month",
    av30Included: 15,
    priceInPounds: 49.99,
  },
  CORE_YEARLY: {
    code: "CORE_YEARLY",
    tier: "starter",
    interval: "yearly",
    displayName: "Core (Yearly)",
    priceDisplay: "£499 per year",
    av30Included: 15,
    priceInPounds: 499,
  },
  MINIMUM_MONTHLY: {
    code: "MINIMUM_MONTHLY",
    tier: "starter",
    interval: "monthly",
    displayName: "Core (Monthly)",
    priceDisplay: "£49.99 per month",
    av30Included: 15,
    priceInPounds: 49.99,
  },
  MINIMUM_YEARLY: {
    code: "MINIMUM_YEARLY",
    tier: "starter",
    interval: "yearly",
    displayName: "Core (Yearly)",
    priceDisplay: "£499 per year",
    av30Included: 15,
    priceInPounds: 499,
  },
  STARTER_MONTHLY: {
    code: "STARTER_MONTHLY",
    tier: "starter",
    interval: "monthly",
    displayName: "Starter (Monthly)",
    priceDisplay: "£149 per month",
    av30Included: 50,
    priceInPounds: 149,
  },
  STARTER_YEARLY: {
    code: "STARTER_YEARLY",
    tier: "starter",
    interval: "yearly",
    displayName: "Starter (Yearly)",
    priceDisplay: "£1,490 per year",
    av30Included: 50,
    priceInPounds: 1490,
  },
  GROWTH_MONTHLY: {
    code: "GROWTH_MONTHLY",
    tier: "growth",
    interval: "monthly",
    displayName: "Growth (Monthly)",
    priceDisplay: "£399 per month",
    av30Included: 200,
    priceInPounds: 399,
  },
  GROWTH_YEARLY: {
    code: "GROWTH_YEARLY",
    tier: "growth",
    interval: "yearly",
    displayName: "Growth (Yearly)",
    priceDisplay: "£3,990 per year",
    av30Included: 200,
    priceInPounds: 3990,
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

/**
 * True if the given date string is in the past (e.g. renewal date not yet updated by webhook).
 */
export function isRenewalDateInPast(dateString?: string | null): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() < Date.now();
}

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Date to display as "next renewal": uses Stripe periodEnd when it's in the future,
 * otherwise computes the next period end from the last period (periodStart → periodEnd)
 * so the UI shows a sensible date until the webhook updates.
 */
export function getDisplayPeriodEnd(
  periodStart?: string | null,
  periodEnd?: string | null,
): Date | null {
  if (!periodEnd) return null;
  const end = new Date(periodEnd);
  if (Number.isNaN(end.getTime())) return null;
  const now = Date.now();
  if (end.getTime() >= now) return end;

  let periodMs = 0;
  if (periodStart) {
    const start = new Date(periodStart);
    if (!Number.isNaN(start.getTime())) periodMs = end.getTime() - start.getTime();
  }
  if (periodMs <= 0) periodMs = ONE_MONTH_MS;

  let next = end.getTime();
  while (next < now) next += periodMs;
  return new Date(next);
}

