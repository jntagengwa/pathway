import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Inject,
  Post,
} from "@nestjs/common";
import {
  prisma,
  SubscriptionStatus,
  Prisma,
  PendingOrderStatus,
} from "@pathway/db";
import { EntitlementsService } from "./entitlements.service";
import {
  BILLING_WEBHOOK_PROVIDER,
  BillingWebhookProvider,
  FakeBillingWebhookProvider,
  ParsedBillingWebhookEvent,
} from "./billing-webhook.provider";
import { LoggingService, StructuredLogger } from "../common/logging/logging.service";

type WebhookResult =
  | { status: "ok"; eventId: string }
  | { status: "ignored_duplicate"; eventId: string }
  | { status: "ignored_unknown"; eventId: string };

type PendingOrderRecord = Prisma.PendingOrderGetPayload<
  Record<string, never>
>;

@Controller("billing")
export class BillingWebhookController {
  private readonly logger: StructuredLogger;

  constructor(
    @Inject(BILLING_WEBHOOK_PROVIDER)
    private readonly provider: BillingWebhookProvider,
    private readonly entitlements: EntitlementsService,
    logging: LoggingService,
  ) {
    this.logger = logging.createLogger(BillingWebhookController.name);
  }

  @Post("webhook")
  @HttpCode(200)
  async handleWebhook(
    @Body() body: unknown,
    @Headers("x-billing-signature") signature?: string,
  ): Promise<WebhookResult> {
    const event = await this.provider.verifyAndParse(body, signature);

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

  private async applyEvent(
    event: ParsedBillingWebhookEvent,
  ): Promise<boolean> {
    switch (event.kind) {
      case "subscription.updated":
      case "subscription.created":
      case "invoice.paid":
        await this.handleSubscriptionEvent(
          event,
          event.status ?? SubscriptionStatus.ACTIVE,
        );
        return true;
      case "subscription.canceled":
        await this.handleSubscriptionEvent(event, SubscriptionStatus.CANCELED);
        return true;
      case "unknown":
      default:
        return false;
    }
  }

  private async handleSubscriptionEvent(
    event: ParsedBillingWebhookEvent,
    status: SubscriptionStatus,
  ) {
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

  private async upsertSubscription(
    event: ParsedBillingWebhookEvent,
    status: SubscriptionStatus,
    tx: Prisma.TransactionClient | typeof prisma = prisma,
  ) {
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

  private async applyPendingOrder(
    event: ParsedBillingWebhookEvent,
    status: SubscriptionStatus,
    pendingOrder: PendingOrderRecord,
  ) {
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
          providerCheckoutId:
            pendingOrder.providerCheckoutId ??
            event.providerCheckoutId ??
            undefined,
        },
      });
    });
  }

  private buildFlagsFromPending(
    pendingOrder: PendingOrderRecord,
  ): Prisma.InputJsonValue | undefined {
    const flags: Record<string, unknown> = {};
    if (pendingOrder.smsMessagesCap !== null && pendingOrder.smsMessagesCap !== undefined) {
      flags.smsMessagesCap = pendingOrder.smsMessagesCap;
    }
    if (pendingOrder.flags) {
      flags.pendingOrderFlags = pendingOrder.flags;
    }
    if (pendingOrder.warnings) {
      flags.pendingOrderWarnings = pendingOrder.warnings;
    }
    return Object.keys(flags).length ? (flags as Prisma.InputJsonValue) : undefined;
  }

  private async findPendingOrder(
    event: ParsedBillingWebhookEvent,
  ): Promise<PendingOrderRecord | null> {
    if (event.pendingOrderId) {
      const direct = await prisma.pendingOrder.findUnique({
        where: { id: event.pendingOrderId },
      });
      if (direct) return direct;
    }

    if (event.providerCheckoutId) {
      const byCheckout = await prisma.pendingOrder.findFirst({
        where: {
          provider: event.provider,
          providerCheckoutId: event.providerCheckoutId,
        },
      });
      if (byCheckout) return byCheckout;
    }

    const bySubscription = await prisma.pendingOrder.findFirst({
      where: {
        provider: event.provider,
        providerSubscriptionId: event.subscriptionId,
      },
    });
    return bySubscription;
  }

  private async maybeSnapshotEntitlements(event: ParsedBillingWebhookEvent) {
    const ent = event.entitlements;
    if (
      !ent ||
      ent.av30Included === undefined ||
      ent.leaderSeatsIncluded === undefined ||
      ent.storageGbIncluded === undefined ||
      ent.maxSites === undefined
    ) {
      return;
    }

    await prisma.orgEntitlementSnapshot.create({
      data: {
        orgId: event.orgId,
        maxSites: ent.maxSites ?? 0,
        av30Included: ent.av30Included ?? 0,
        leaderSeatsIncluded: ent.leaderSeatsIncluded ?? 0,
        storageGbIncluded: ent.storageGbIncluded ?? 0,
        flagsJson:
          (ent.flagsJson as Prisma.InputJsonValue | null | undefined) ??
          undefined,
        source: "webhook",
      },
    });
  }
}

// Provider binding for the Nest DI container (kept here to avoid a separate module file)
export const billingWebhookProviderBinding = {
  provide: BILLING_WEBHOOK_PROVIDER,
  useClass: FakeBillingWebhookProvider,
};

