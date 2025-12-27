/**
 * Pricing catalogue types for Nexsteps plans.
 * Plan codes align with backend billing-plans.ts to prevent drift.
 */

export type PlanTier = "starter" | "growth" | "enterprise";

export type BillingPeriod = "monthly" | "yearly" | "contact";

export type PlanCode =
  | "STARTER_MONTHLY"
  | "STARTER_YEARLY"
  | "GROWTH_MONTHLY"
  | "GROWTH_YEARLY"
  | "ENTERPRISE_CONTACT";

export interface PlanDefinition {
  code: PlanCode;
  tier: PlanTier;
  displayName: string;
  tagline: string;
  billingPeriod: BillingPeriod;
  pricePerMonth?: number; // in GBP, major units (e.g. 149 = £149)
  pricePerYear?: number; // in GBP, major units (e.g. 1490 = £1,490)
  currency: "GBP";
  selfServe: boolean;
  av30Included: number | null; // Active People (AV30) included
  maxSitesIncluded: number | null; // Number of sites included
  features: string[];
  addons?: {
    label: string;
    description: string;
  }[];
  notes?: string[];
  bestFor?: string; // e.g. "Single-site schools getting started"
}

export interface PricingFaq {
  question: string;
  answer: string;
}

