/**
 * Basic type-checking tests for pricing catalogue.
 * These assertions ensure the catalogue structure is correct.
 */
import { PLANS, orderedPlanCodes, getPlansByTier, getSelfServePlans } from "../catalog";
import type { PlanCode } from "../types";

// Simple runtime assertions (no test framework required for basic validation)
function assertPricingCatalogue() {
  const expectedCodes: PlanCode[] = [
    "STARTER_MONTHLY",
    "STARTER_YEARLY",
    "GROWTH_MONTHLY",
    "GROWTH_YEARLY",
    "ENTERPRISE_CONTACT",
  ];

  // Verify all expected codes exist
  expectedCodes.forEach((code) => {
    if (!PLANS[code]) {
      throw new Error(`Missing plan code: ${code}`);
    }
    if (PLANS[code].code !== code) {
      throw new Error(`Plan code mismatch for ${code}`);
    }
  });

  // Verify orderedPlanCodes
  if (orderedPlanCodes.length !== 5) {
    throw new Error(`Expected 5 plan codes, got ${orderedPlanCodes.length}`);
  }
  orderedPlanCodes.forEach((code) => {
    if (!PLANS[code]) {
      throw new Error(`Ordered plan code ${code} not found in PLANS`);
    }
  });

  // Verify tier grouping
  const byTier = getPlansByTier();
  if (byTier.starter.length !== 2) {
    throw new Error(`Expected 2 starter plans, got ${byTier.starter.length}`);
  }
  if (byTier.growth.length !== 2) {
    throw new Error(`Expected 2 growth plans, got ${byTier.growth.length}`);
  }
  if (byTier.enterprise.length !== 1) {
    throw new Error(`Expected 1 enterprise plan, got ${byTier.enterprise.length}`);
  }

  // Verify self-serve filtering
  const selfServe = getSelfServePlans();
  if (selfServe.length !== 4) {
    throw new Error(`Expected 4 self-serve plans, got ${selfServe.length}`);
  }
  selfServe.forEach((plan) => {
    if (!plan.selfServe) {
      throw new Error(`Plan ${plan.code} should be self-serve`);
    }
  });

  // Verify plan structure
  Object.values(PLANS).forEach((plan) => {
    if (!plan.code || !plan.tier || !plan.displayName || !plan.tagline || !plan.billingPeriod) {
      throw new Error(`Plan ${plan.code} missing required fields`);
    }
    if (plan.currency !== "GBP") {
      throw new Error(`Plan ${plan.code} should have currency GBP`);
    }
    if (typeof plan.selfServe !== "boolean") {
      throw new Error(`Plan ${plan.code} selfServe should be boolean`);
    }
    if (!Array.isArray(plan.features)) {
      throw new Error(`Plan ${plan.code} features should be an array`);
    }
  });
}

// Export for potential use in build/typecheck scripts
export { assertPricingCatalogue };

