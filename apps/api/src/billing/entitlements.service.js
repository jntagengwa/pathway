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
import { Injectable, Optional } from "@nestjs/common";
import { PathwayRequestContext } from "@pathway/auth";
import { prisma } from "@pathway/db";
import { getPlanDefinition } from "./billing-plans";
let EntitlementsService = class EntitlementsService {
    requestContext;
    constructor(requestContext) {
        this.requestContext = requestContext;
    }
    /**
     * Resolve entitlements for an org. If orgId is omitted, uses the current
     * request context (when available). Does not enforce limits; callers can use
     * the resolved data for enforcement/UX decisions.
     */
    async resolve(orgId) {
        const resolvedOrgId = this.resolveOrgId(orgId);
        const [subscription, snapshot, usage] = await Promise.all([
            prisma.subscription.findFirst({
                where: { orgId: resolvedOrgId },
                orderBy: [{ periodEnd: "desc" }],
            }),
            prisma.orgEntitlementSnapshot.findFirst({
                where: { orgId: resolvedOrgId },
                orderBy: [{ createdAt: "desc" }],
            }),
            prisma.usageCounters.findFirst({
                where: { orgId: resolvedOrgId },
                orderBy: [{ calculatedAt: "desc" }],
            }),
        ]);
        // Snapshot wins; plan catalogue provides defaults when no snapshot exists.
        const planDefinition = getPlanDefinition(subscription?.planCode);
        const flagsFromSnapshot = toRecord(snapshot?.flagsJson);
        const smsMessagesCapFromSnapshot = numberOrNull(flagsFromSnapshot?.smsMessagesCap);
        const av30Cap = snapshot?.av30Included ?? planDefinition?.av30Included ?? null;
        const storageGbCap = snapshot?.storageGbIncluded ?? planDefinition?.storageGbIncluded ?? null;
        const smsMessagesCap = smsMessagesCapFromSnapshot ??
            (snapshot ? null : planDefinition?.smsMessagesIncluded ?? null);
        const leaderSeatsIncluded = snapshot?.leaderSeatsIncluded ??
            planDefinition?.leaderSeatsIncluded ??
            null;
        const maxSites = snapshot?.maxSites ?? planDefinition?.maxSitesIncluded ?? null;
        const flags = snapshot
            ? flagsFromSnapshot
            : planDefinition
                ? {
                    ...(planDefinition.flags ?? {}),
                    planTier: planDefinition.tier,
                    planCode: planDefinition.code,
                }
                : null;
        const source = snapshot
            ? snapshot.source ?? "snapshot"
            : planDefinition
                ? "plan_catalogue"
                : "fallback";
        return {
            orgId: resolvedOrgId,
            subscriptionStatus: subscription?.status ?? "NONE",
            subscription: subscription
                ? {
                    id: subscription.id,
                    provider: subscription.provider,
                    planCode: subscription.planCode,
                    status: subscription.status,
                    periodStart: subscription.periodStart,
                    periodEnd: subscription.periodEnd,
                    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                }
                : undefined,
            av30Cap,
            storageGbCap,
            smsMessagesCap,
            leaderSeatsIncluded,
            maxSites,
            currentAv30: usage?.av30 ?? null,
            storageGbUsage: usage?.storageGb ?? null,
            smsMonthUsage: usage?.smsMonth ?? null,
            usageCalculatedAt: usage?.calculatedAt ?? null,
            flags,
            source,
        };
    }
    resolveOrgId(orgId) {
        if (orgId)
            return orgId;
        const contextOrgId = this.requestContext?.currentOrgId;
        if (contextOrgId)
            return contextOrgId;
        throw new Error("orgId is required to resolve entitlements");
    }
};
EntitlementsService = __decorate([
    Injectable(),
    __param(0, Optional()),
    __metadata("design:paramtypes", [PathwayRequestContext])
], EntitlementsService);
export { EntitlementsService };
const toRecord = (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return null;
    return value;
};
const numberOrNull = (value) => typeof value === "number" ? value : null;
