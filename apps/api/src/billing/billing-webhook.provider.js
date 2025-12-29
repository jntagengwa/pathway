var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BadRequestException, Injectable } from "@nestjs/common";
import { BillingProvider, SubscriptionStatus } from "@pathway/db";
export const BILLING_WEBHOOK_PROVIDER = Symbol("BILLING_WEBHOOK_PROVIDER");
/**
 * Fake provider used for tests and local development.
 * Signature check is intentionally simple; replace with real provider logic later.
 */
let FakeBillingWebhookProvider = class FakeBillingWebhookProvider {
    async verifyAndParse(body, signature, _rawBody) {
        void _rawBody;
        if (!signature || signature !== "test-signature") {
            throw new BadRequestException("Invalid webhook signature");
        }
        const payload = typeof body === "string"
            ? safeParse(body)
            : body;
        if (!payload ||
            typeof payload !== "object" ||
            !payload.eventId ||
            !payload.type ||
            !payload.orgId ||
            !payload.subscriptionId) {
            throw new BadRequestException("Missing required webhook fields");
        }
        const kind = mapType(payload.type);
        const status = mapStatus(payload.status);
        return {
            provider: BillingProvider.STRIPE,
            eventId: String(payload.eventId),
            kind,
            orgId: String(payload.orgId),
            subscriptionId: String(payload.subscriptionId),
            planCode: payload.planCode !== undefined ? String(payload.planCode) : null,
            status,
            periodStart: payload.periodStart ? new Date(payload.periodStart) : null,
            periodEnd: payload.periodEnd ? new Date(payload.periodEnd) : null,
            cancelAtPeriodEnd: payload.cancelAtPeriodEnd !== undefined
                ? Boolean(payload.cancelAtPeriodEnd)
                : null,
            pendingOrderId: payload.pendingOrderId !== undefined
                ? String(payload.pendingOrderId)
                : null,
            providerCheckoutId: payload.providerCheckoutId !== undefined
                ? String(payload.providerCheckoutId)
                : null,
            entitlements: payload.entitlements,
        };
    }
};
FakeBillingWebhookProvider = __decorate([
    Injectable()
], FakeBillingWebhookProvider);
export { FakeBillingWebhookProvider };
const safeParse = (raw) => {
    try {
        return JSON.parse(raw);
    }
    catch {
        throw new BadRequestException("Invalid JSON payload");
    }
};
const mapType = (type) => {
    switch (type) {
        case "subscription.updated":
            return "subscription.updated";
        case "subscription.created":
            return "subscription.created";
        case "subscription.canceled":
            return "subscription.canceled";
        case "invoice.paid":
            return "invoice.paid";
        default:
            return "unknown";
    }
};
const mapStatus = (status) => {
    if (typeof status !== "string")
        return null;
    if (status === SubscriptionStatus.ACTIVE ||
        status === SubscriptionStatus.PAST_DUE ||
        status === SubscriptionStatus.CANCELED ||
        status === SubscriptionStatus.TRIALING ||
        status === SubscriptionStatus.INCOMPLETE) {
        return status;
    }
    return null;
};
