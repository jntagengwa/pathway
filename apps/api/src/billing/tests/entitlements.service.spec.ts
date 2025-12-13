import { EntitlementsService } from "../entitlements.service";
import { BillingProvider, SubscriptionStatus } from "@pathway/db";

const prismaMock = {
  subscription: { findFirst: jest.fn() },
  orgEntitlementSnapshot: { findFirst: jest.fn() },
  usageCounters: { findFirst: jest.fn() },
};

jest.mock("@pathway/db", () => {
  const actual = jest.requireActual("@pathway/db");
  return {
    ...actual,
    get prisma() {
      return prismaMock;
    },
  };
});

describe("EntitlementsService", () => {
  const orgId = "org_test_123";
  let service: EntitlementsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EntitlementsService();
  });

  it("resolves entitlements for an active subscription with usage", async () => {
    const subscription = {
      id: "sub_123",
      orgId,
      provider: BillingProvider.STRIPE,
      planCode: "pro",
      status: SubscriptionStatus.ACTIVE,
      periodStart: new Date("2024-01-01T00:00:00Z"),
      periodEnd: new Date("2024-02-01T00:00:00Z"),
      cancelAtPeriodEnd: false,
      createdAt: new Date("2023-12-15T00:00:00Z"),
      updatedAt: new Date("2024-01-15T00:00:00Z"),
    };
    const snapshot = {
      id: "snap_123",
      orgId,
      maxSites: 3,
      av30Included: 50,
      leaderSeatsIncluded: 20,
      storageGbIncluded: 200,
      flagsJson: { smsMessagesCap: 1200 },
      source: "subscription-pro",
      createdAt: new Date("2024-01-01T00:00:00Z"),
    };
    const usage = {
      id: "usage_123",
      orgId,
      av30: 12,
      storageGb: 10,
      smsMonth: 150,
      exportsMonth: 0,
      calculatedAt: new Date("2024-01-10T00:00:00Z"),
    };

    prismaMock.subscription.findFirst.mockResolvedValue(subscription);
    prismaMock.orgEntitlementSnapshot.findFirst.mockResolvedValue(snapshot);
    prismaMock.usageCounters.findFirst.mockResolvedValue(usage);

    const result = await service.resolve(orgId);

    expect(result.subscriptionStatus).toBe(SubscriptionStatus.ACTIVE);
    expect(result.subscription).toEqual(
      expect.objectContaining({
        id: subscription.id,
        provider: BillingProvider.STRIPE,
        planCode: "pro",
        periodEnd: subscription.periodEnd,
      }),
    );
    expect(result.av30Cap).toBe(50);
    expect(result.leaderSeatsIncluded).toBe(20);
    expect(result.storageGbCap).toBe(200);
    expect(result.smsMessagesCap).toBe(1200);
    expect(result.currentAv30).toBe(12);
    expect(result.storageGbUsage).toBe(10);
    expect(result.smsMonthUsage).toBe(150);
  });

  it("returns canceled subscription status and null caps when snapshot is missing", async () => {
    const subscription = {
      id: "sub_cancel",
      orgId,
      provider: BillingProvider.STRIPE,
      planCode: "starter",
      status: SubscriptionStatus.CANCELED,
      periodStart: new Date("2023-10-01T00:00:00Z"),
      periodEnd: new Date("2023-11-01T00:00:00Z"),
      cancelAtPeriodEnd: true,
      createdAt: new Date("2023-09-15T00:00:00Z"),
      updatedAt: new Date("2023-10-15T00:00:00Z"),
    };

    prismaMock.subscription.findFirst.mockResolvedValue(subscription);
    prismaMock.orgEntitlementSnapshot.findFirst.mockResolvedValue(null);
    prismaMock.usageCounters.findFirst.mockResolvedValue(null);

    const result = await service.resolve(orgId);

    expect(result.subscriptionStatus).toBe(SubscriptionStatus.CANCELED);
    expect(result.av30Cap).toBeNull();
    expect(result.storageGbCap).toBeNull();
    expect(result.smsMessagesCap).toBeNull();
    expect(result.subscription?.planCode).toBe("starter");
  });

  it("handles orgs with no subscription or usage gracefully", async () => {
    prismaMock.subscription.findFirst.mockResolvedValue(null);
    prismaMock.orgEntitlementSnapshot.findFirst.mockResolvedValue(null);
    prismaMock.usageCounters.findFirst.mockResolvedValue(null);

    const result = await service.resolve(orgId);

    expect(result.subscriptionStatus).toBe("NONE");
    expect(result.subscription).toBeUndefined();
    expect(result.av30Cap).toBeNull();
    expect(result.currentAv30).toBeNull();
    expect(result.smsMessagesCap).toBeNull();
  });
});

