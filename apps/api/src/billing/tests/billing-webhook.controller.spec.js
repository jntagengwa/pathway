import { BadRequestException } from "@nestjs/common";
import { BillingWebhookController } from "../webhook.controller";
import { LoggingService } from "../../common/logging/logging.service";
import { BillingProvider, SubscriptionStatus, PendingOrderStatus, } from "@pathway/db";
const prismaMock = {
    billingEvent: { findFirst: jest.fn(), create: jest.fn() },
    subscription: { upsert: jest.fn() },
    orgEntitlementSnapshot: { create: jest.fn() },
    pendingOrder: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
    },
    $transaction: jest.fn((cb) => Promise.resolve(cb(prismaMock))),
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
    const baseEvent = {
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
    let controller;
    let provider;
    let entitlements;
    const logging = new LoggingService();
    beforeEach(() => {
        jest.clearAllMocks();
        prismaMock.pendingOrder.findUnique.mockResolvedValue(null);
        prismaMock.pendingOrder.findFirst.mockResolvedValue(null);
        provider = {
            verifyAndParse: jest
                .fn()
                .mockResolvedValue(baseEvent),
        };
        entitlements = {
            resolve: jest.fn().mockResolvedValue(baseEvent),
        };
        controller = new BillingWebhookController(provider, entitlements, logging);
    });
    it("handles subscription update and records billing event", async () => {
        prismaMock.billingEvent.findFirst.mockResolvedValue(null);
        const result = await controller.handleWebhook({ dummy: true }, "test-signature");
        expect(result.status).toBe("ok");
        expect(prismaMock.subscription.upsert).toHaveBeenCalledTimes(1);
        expect(prismaMock.orgEntitlementSnapshot.create).toHaveBeenCalledTimes(1);
        expect(prismaMock.billingEvent.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                payloadJson: expect.objectContaining({ eventId: baseEvent.eventId }),
            }),
        }));
        expect(entitlements.resolve).toHaveBeenCalledWith(baseEvent.orgId);
    });
    it("skips duplicate events idempotently", async () => {
        prismaMock.billingEvent.findFirst.mockResolvedValue({ id: "existing" });
        const result = await controller.handleWebhook({ dummy: true }, "test-signature");
        expect(result.status).toBe("ignored_duplicate");
        expect(prismaMock.subscription.upsert).not.toHaveBeenCalled();
        expect(prismaMock.billingEvent.create).not.toHaveBeenCalled();
        expect(entitlements.resolve).not.toHaveBeenCalled();
    });
    it("rejects invalid signatures", async () => {
        provider.verifyAndParse.mockRejectedValue(new BadRequestException("Invalid"));
        await expect(controller.handleWebhook({ dummy: true }, "bad-signature")).rejects.toBeInstanceOf(BadRequestException);
    });
    it("ignores unknown event types but still records the event", async () => {
        const unknownEvent = {
            ...baseEvent,
            eventId: "evt_unknown",
            kind: "unknown",
        };
        provider.verifyAndParse.mockResolvedValue(unknownEvent);
        prismaMock.billingEvent.findFirst.mockResolvedValue(null);
        const result = await controller.handleWebhook({ dummy: true }, "test-signature");
        expect(result.status).toBe("ignored_unknown");
        expect(prismaMock.subscription.upsert).not.toHaveBeenCalled();
        expect(prismaMock.orgEntitlementSnapshot.create).not.toHaveBeenCalled();
        expect(prismaMock.billingEvent.create).toHaveBeenCalled();
    });
    it("applies pending order caps and completes the order", async () => {
        const pending = {
            id: "po_1",
            orgId: baseEvent.orgId,
            tenantId: "tenant_1",
            planCode: "pro",
            av30Cap: 75,
            storageGbCap: 100,
            smsMessagesCap: 500,
            leaderSeatsIncluded: 5,
            maxSites: 2,
            flags: { note: "from preview" },
            warnings: ["price_not_included"],
            provider: BillingProvider.STRIPE,
            providerCheckoutId: "co_1",
            providerSubscriptionId: null,
            status: PendingOrderStatus.PENDING,
        };
        const eventWithPending = {
            ...baseEvent,
            pendingOrderId: pending.id,
        };
        prismaMock.pendingOrder.findUnique.mockResolvedValue(pending);
        prismaMock.billingEvent.findFirst.mockResolvedValue(null);
        provider.verifyAndParse.mockResolvedValue(eventWithPending);
        const result = await controller.handleWebhook({ dummy: true }, "test-signature");
        expect(result.status).toBe("ok");
        expect(prismaMock.subscription.upsert).toHaveBeenCalled();
        expect(prismaMock.orgEntitlementSnapshot.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({
                orgId: baseEvent.orgId,
                av30Included: pending.av30Cap,
                maxSites: pending.maxSites,
                storageGbIncluded: pending.storageGbCap,
                leaderSeatsIncluded: pending.leaderSeatsIncluded,
            }),
        }));
        expect(prismaMock.pendingOrder.update).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: pending.id },
            data: expect.objectContaining({
                status: PendingOrderStatus.COMPLETED,
                providerSubscriptionId: baseEvent.subscriptionId,
            }),
        }));
    });
});
