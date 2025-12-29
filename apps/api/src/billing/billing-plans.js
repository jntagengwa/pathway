export const PLAN_CATALOGUE = {
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
export function getPlanDefinition(planCode) {
    if (!planCode)
        return null;
    if (planCode in PLAN_CATALOGUE) {
        return PLAN_CATALOGUE[planCode];
    }
    return null;
}
