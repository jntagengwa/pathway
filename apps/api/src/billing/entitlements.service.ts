import { Injectable, Optional } from "@nestjs/common";
import { PathwayRequestContext } from "@pathway/auth";
import { prisma, SubscriptionStatus, BillingProvider } from "@pathway/db";

export type SubscriptionState = SubscriptionStatus | "NONE";

export type ResolvedEntitlements = {
  orgId: string;
  subscriptionStatus: SubscriptionState;
  subscription?:
    | {
        id: string;
        provider: BillingProvider;
        planCode: string;
        status: SubscriptionStatus;
        periodStart: Date;
        periodEnd: Date;
        cancelAtPeriodEnd: boolean;
      }
    | undefined;
  av30Cap: number | null;
  storageGbCap: number | null;
  smsMessagesCap: number | null;
  leaderSeatsIncluded: number | null;
  maxSites: number | null;
  currentAv30: number | null;
  storageGbUsage: number | null;
  smsMonthUsage: number | null;
  usageCalculatedAt: Date | null;
  flags: Record<string, unknown> | null;
  source: string | null;
};

@Injectable()
export class EntitlementsService {
  constructor(
    @Optional()
    private readonly requestContext?: PathwayRequestContext,
  ) {}

  /**
   * Resolve entitlements for an org. If orgId is omitted, uses the current
   * request context (when available). Does not enforce limits; callers can use
   * the resolved data for enforcement/UX decisions.
   */
  async resolve(orgId?: string): Promise<ResolvedEntitlements> {
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

    const flags = toRecord(snapshot?.flagsJson);
    const smsMessagesCap = numberOrNull(flags?.smsMessagesCap);

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
      av30Cap: snapshot?.av30Included ?? null,
      storageGbCap: snapshot?.storageGbIncluded ?? null,
      smsMessagesCap,
      leaderSeatsIncluded: snapshot?.leaderSeatsIncluded ?? null,
      maxSites: snapshot?.maxSites ?? null,
      currentAv30: usage?.av30 ?? null,
      storageGbUsage: usage?.storageGb ?? null,
      smsMonthUsage: usage?.smsMonth ?? null,
      usageCalculatedAt: usage?.calculatedAt ?? null,
      flags,
      source: snapshot?.source ?? null,
      // TODO(Epic4): define system defaults when an org lacks snapshots/subscriptions.
    };
  }

  private resolveOrgId(orgId?: string): string {
    if (orgId) return orgId;
    const contextOrgId = this.requestContext?.currentOrgId;
    if (contextOrgId) return contextOrgId;
    throw new Error("orgId is required to resolve entitlements");
  }
}

const toRecord = (
  value: unknown,
): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const numberOrNull = (value: unknown): number | null =>
  typeof value === "number" ? value : null;

