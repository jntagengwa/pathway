var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BillingWebhookController_1;
import { Body, Controller, Headers, HttpCode, Inject, Logger, Post, } from "@nestjs/common";
import { prisma, SubscriptionStatus, PendingOrderStatus, } from "@pathway/db";
import { EntitlementsService } from "./entitlements.service";
import { BILLING_WEBHOOK_PROVIDER, } from "./billing-webhook.provider";
import { LoggingService } from "../common/logging/logging.service";
// Core billing webhook controller. For Stripe, this endpoint is the SNAPSHOT
// webhook: it handles checkout.session.completed, customer.subscription.* and
// invoice.* events verified with STRIPE_WEBHOOK_SECRET_SNAPSHOT and feeds the
// PendingOrder -> Subscription -> OrgEntitlementSnapshot pipeline.
let BillingWebhookController = BillingWebhookController_1 = class BillingWebhookController {
    provider;
    entitlements;
    logger;
    constructor(provider, entitlements, logging) {
        this.provider = provider;
        this.entitlements = entitlements;
        this.logger = logging
            ? logging.createLogger(BillingWebhookController_1.name)
            : this.createFallbackLogger();
    }
    createFallbackLogger() {
        const nest = new Logger(BillingWebhookController_1.name);
        return {
            info: (message, meta) => nest.log(message, meta),
            warn: (message, meta) => nest.warn(message, meta),
            error: (message, meta, trace) => nest.error(message, trace || meta),
        };
    }
    async handleWebhook(body, signature, stripeSignature) {
        const sig = signature ?? stripeSignature;
        const event = await this.provider.verifyAndParse(body, sig);
        const alreadyHandled = await prisma.billingEvent.findFirst({
            where: {
                provider: event.provider,
                payloadJson: { path: ["eventId"], equals: event.eventId },
            },
            select: { id: true },
        });
        if (alreadyHandled) {
            this.logger.info("Duplicate webhook ignored", {
                provider: event.provider,
                eventId: event.eventId,
                orgId: event.orgId,
            });
            return { status: "ignored_duplicate", eventId: event.eventId };
        }
        const applied = await this.applyEvent(event);
        await prisma.billingEvent.create({
            data: {
                orgId: event.orgId,
                provider: event.provider,
                type: event.kind,
                payloadJson: {
                    eventId: event.eventId,
                    subscriptionId: event.subscriptionId,
                    orgId: event.orgId,
                },
            },
        });
        if (applied) {
            // Warm the resolver; no enforcement here.
            await this.entitlements.resolve(event.orgId);
            return { status: "ok", eventId: event.eventId };
        }
        this.logger.info("Unknown billing event ignored", {
            provider: event.provider,
            eventId: event.eventId,
            orgId: event.orgId,
            kind: event.kind,
        });
        return { status: "ignored_unknown", eventId: event.eventId };
    }
    async applyEvent(event) {
        switch (event.kind) {
            case "subscription.updated":
            case "subscription.created":
            case "invoice.paid":
                await this.handleSubscriptionEvent(event, event.status ?? SubscriptionStatus.ACTIVE);
                return true;
            case "invoice.payment_failed":
                // Mark subscription as at-risk (past due) without applying pending orders.
                await this.upsertSubscription(event, event.status ?? SubscriptionStatus.PAST_DUE);
                return true;
            case "subscription.canceled":
                await this.handleSubscriptionEvent(event, SubscriptionStatus.CANCELED);
                return true;
            case "unknown":
            default:
                return false;
        }
    }
    async handleSubscriptionEvent(event, status) {
        const pendingOrder = await this.findPendingOrder(event);
        if (pendingOrder) {
            await this.upsertSubscription(event, status);
            if (pendingOrder.status !== PendingOrderStatus.COMPLETED) {
                await this.applyPendingOrder(event, status, pendingOrder);
            }
            return;
        }
        await this.upsertSubscription(event, status);
        await this.maybeSnapshotEntitlements(event);
    }
    async upsertSubscription(event, status, tx = prisma) {
        const now = new Date();
        await tx.subscription.upsert({
            where: { providerSubId: event.subscriptionId },
            update: {
                planCode: event.planCode ?? undefined,
                status,
                periodStart: event.periodStart ?? now,
                periodEnd: event.periodEnd ?? now,
                cancelAtPeriodEnd: event.cancelAtPeriodEnd ?? false,
            },
            create: {
                orgId: event.orgId,
                provider: event.provider,
                providerSubId: event.subscriptionId,
                planCode: event.planCode ?? "unknown",
                status,
                periodStart: event.periodStart ?? now,
                periodEnd: event.periodEnd ?? now,
                cancelAtPeriodEnd: event.cancelAtPeriodEnd ?? false,
            },
        });
    }
    async applyPendingOrder(event, status, pendingOrder) {
        const now = new Date();
        await prisma.$transaction(async (tx) => {
            await this.upsertSubscription(event, status, tx);
            await tx.orgEntitlementSnapshot.create({
                data: {
                    orgId: pendingOrder.orgId,
                    maxSites: pendingOrder.maxSites ?? 0,
                    av30Included: pendingOrder.av30Cap ?? 0,
                    leaderSeatsIncluded: pendingOrder.leaderSeatsIncluded ?? 0,
                    storageGbIncluded: pendingOrder.storageGbCap ?? 0,
                    flagsJson: this.buildFlagsFromPending(pendingOrder),
                    source: "pending_order",
                },
            });
            await tx.pendingOrder.update({
                where: { id: pendingOrder.id },
                data: {
                    status: PendingOrderStatus.COMPLETED,
                    completedAt: now,
                    providerSubscriptionId: event.subscriptionId ?? undefined,
                    providerCheckoutId: pendingOrder.providerCheckoutId ??
                        event.providerCheckoutId ??
                        undefined,
                    providerCustomerId: event.providerCustomerId ?? undefined,
                },
            });
        });
    }
    buildFlagsFromPending(pendingOrder) {
        const flags = {};
        if (pendingOrder.smsMessagesCap !== null && pendingOrder.smsMessagesCap !== undefined) {
            flags.smsMessagesCap = pendingOrder.smsMessagesCap;
        }
        if (pendingOrder.flags) {
            flags.pendingOrderFlags = pendingOrder.flags;
        }
        if (pendingOrder.warnings) {
            flags.pendingOrderWarnings = pendingOrder.warnings;
        }
        return Object.keys(flags).length ? flags : undefined;
    }
    async findPendingOrder(event) {
        if (event.pendingOrderId) {
            const direct = await prisma.pendingOrder.findUnique({
                where: { id: event.pendingOrderId },
            });
            if (direct)
                return direct;
        }
        if (event.providerCheckoutId) {
            const byCheckout = await prisma.pendingOrder.findFirst({
                where: {
                    provider: event.provider,
                    providerCheckoutId: event.providerCheckoutId,
                },
            });
            if (byCheckout)
                return byCheckout;
        }
        const bySubscription = await prisma.pendingOrder.findFirst({
            where: {
                provider: event.provider,
                providerSubscriptionId: event.subscriptionId,
            },
        });
        return bySubscription;
    }
    async maybeSnapshotEntitlements(event) {
        const ent = event.entitlements;
        if (!ent ||
            ent.av30Included === undefined ||
            ent.leaderSeatsIncluded === undefined ||
            ent.storageGbIncluded === undefined ||
            ent.maxSites === undefined) {
            return;
        }
        await prisma.orgEntitlementSnapshot.create({
            data: {
                orgId: event.orgId,
                maxSites: ent.maxSites ?? 0,
                av30Included: ent.av30Included ?? 0,
                leaderSeatsIncluded: ent.leaderSeatsIncluded ?? 0,
                storageGbIncluded: ent.storageGbIncluded ?? 0,
                flagsJson: ent.flagsJson ??
                    undefined,
                source: "webhook",
            },
        });
    }
};
__decorate([
    Post("webhook"),
    HttpCode(200),
    __param(0, Body()),
    __param(1, Headers("x-billing-signature")),
    __param(2, Headers("stripe-signature")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], BillingWebhookController.prototype, "handleWebhook", null);
BillingWebhookController = BillingWebhookController_1 = __decorate([
    Controller("billing"),
    __param(0, Inject(BILLING_WEBHOOK_PROVIDER)),
    __metadata("design:paramtypes", [Object, EntitlementsService,
        LoggingService])
], BillingWebhookController);
export { BillingWebhookController };
