import { BadRequestException } from "@nestjs/common";
import { BillingWebhookController } from "../webhook.controller";
import {
  BillingWebhookProvider,
  ParsedBillingWebhookEvent,
} from "../billing-webhook.provider";
import { EntitlementsService } from "../entitlements.service";
import { BillingProvider, SubscriptionStatus } from "@pathway/db";

const prismaMock = {
  billingEvent: { findFirst: jest.fn(), create: jest.fn() },
  subscription: { upsert: jest.fn() },
  orgEntitlementSnapshot: { create: jest.fn() },
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

describe("BillingWebhookController", () => {
  const baseEvent: ParsedBillingWebhookEvent = {
    provider: BillingProvider.STRIPE,
    eventId: "evt_123",
    kind: "subscription.updated",
    orgId: "org_1",
    subscriptionId: "sub_1",
    planCode: "pro",
    status: SubscriptionStatus.ACTIVE,
    periodStart: new Date("2024-01-01T00:00:00Z"),
    periodEnd: new Date("2024-02-01T00:00:00Z"),
    cancelAtPeriodEnd: false,
    entitlements: {
      av30Included: 50,
      leaderSeatsIncluded: 10,
      storageGbIncluded: 100,
      maxSites: 2,
    },
  };

  let controller: BillingWebhookController;
  let provider: BillingWebhookProvider;
  let entitlements: jest.Mocked<Pick<EntitlementsService, "resolve">>;

  beforeEach(() => {
    jest.clearAllMocks();

    provider = {
      verifyAndParse: jest.fn().mockResolvedValue(baseEvent),
    };
    entitlements = {
      resolve: jest.fn().mockResolvedValue(baseEvent),
    };

    controller = new BillingWebhookController(
      // Inject with token shape the module uses
      provider as unknown as BillingWebhookProvider,
      entitlements as unknown as EntitlementsService,
    );
  });

  it("handles subscription update and records billing event", async () => {
    prismaMock.billingEvent.findFirst.mockResolvedValue(null);

    const result = await controller.handleWebhook(
      { dummy: true },
      "test-signature",
    );

    expect(result.status).toBe("ok");
    expect(prismaMock.subscription.upsert).toHaveBeenCalledTimes(1);
    expect(prismaMock.orgEntitlementSnapshot.create).toHaveBeenCalledTimes(1);
    expect(prismaMock.billingEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          payloadJson: expect.objectContaining({ eventId: baseEvent.eventId }),
        }),
      }),
    );
    expect(entitlements.resolve).toHaveBeenCalledWith(baseEvent.orgId);
  });

  it("skips duplicate events idempotently", async () => {
    prismaMock.billingEvent.findFirst.mockResolvedValue({ id: "existing" });

    const result = await controller.handleWebhook(
      { dummy: true },
      "test-signature",
    );

    expect(result.status).toBe("ignored_duplicate");
    expect(prismaMock.subscription.upsert).not.toHaveBeenCalled();
    expect(prismaMock.billingEvent.create).not.toHaveBeenCalled();
    expect(entitlements.resolve).not.toHaveBeenCalled();
  });

  it("rejects invalid signatures", async () => {
    (provider.verifyAndParse as jest.Mock).mockRejectedValue(
      new BadRequestException("Invalid"),
    );

    await expect(
      controller.handleWebhook({ dummy: true }, "bad-signature"),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("ignores unknown event types but still records the event", async () => {
    const unknownEvent: ParsedBillingWebhookEvent = {
      ...baseEvent,
      eventId: "evt_unknown",
      kind: "unknown",
    };
    (provider.verifyAndParse as jest.Mock).mockResolvedValue(unknownEvent);
    prismaMock.billingEvent.findFirst.mockResolvedValue(null);

    const result = await controller.handleWebhook(
      { dummy: true },
      "test-signature",
    );

    expect(result.status).toBe("ignored_unknown");
    expect(prismaMock.subscription.upsert).not.toHaveBeenCalled();
    expect(prismaMock.orgEntitlementSnapshot.create).not.toHaveBeenCalled();
    expect(prismaMock.billingEvent.create).toHaveBeenCalled();
  });
});

