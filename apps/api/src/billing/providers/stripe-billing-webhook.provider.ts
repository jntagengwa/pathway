import Stripe from "stripe";
import { Injectable, BadRequestException } from "@nestjs/common";
import {
  BillingWebhookProvider,
  type ParsedBillingWebhookEvent,
} from "../billing-webhook.provider";
import type { BillingProviderConfig } from "../billing-provider.config";
import { BillingProvider, SubscriptionStatus } from "@pathway/db";

@Injectable()
export class StripeBillingWebhookProvider implements BillingWebhookProvider {
  private readonly stripe: Stripe;

  constructor(private readonly config: BillingProviderConfig) {
    if (!config.stripe.secretKey) {
      throw new Error("Stripe secret key is required for Stripe webhook provider");
    }
    this.stripe = new Stripe(config.stripe.secretKey ?? "", {
      apiVersion: "2023-10-16",
    });
  }

  async verifyAndParse(
    body: unknown,
    signature?: string,
    rawBody?: Buffer,
  ): Promise<ParsedBillingWebhookEvent> {
    if (!signature) {
      throw new BadRequestException("Missing webhook signature");
    }
    const secret = this.config.stripe.webhookSecret;
    if (!secret) {
      throw new BadRequestException("Stripe webhook secret not configured");
    }

    let event: Stripe.Event;
    try {
      if (rawBody) {
        event = this.stripe.webhooks.constructEvent(rawBody, signature, secret);
      } else {
        // Fallback when raw body is unavailable; may be less safe.
        const serialized =
          typeof body === "string" ? body : JSON.stringify(body ?? {});
        event = this.stripe.webhooks.constructEvent(
          Buffer.from(serialized),
          signature,
          secret,
        );
      }
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : "Invalid Stripe signature",
      );
    }

    return this.mapEvent(event);
  }

  private mapEvent(event: Stripe.Event): ParsedBillingWebhookEvent {
    switch (event.type) {
      case "checkout.session.completed":
        return this.mapCheckoutCompleted(event as Stripe.CheckoutSessionCompletedEvent);
      case "customer.subscription.updated":
        return this.mapSubscription(event as Stripe.CustomerSubscriptionUpdatedEvent);
      case "customer.subscription.deleted":
        return this.mapSubscription(event as Stripe.CustomerSubscriptionDeletedEvent, true);
      case "invoice.paid":
        return this.mapInvoicePaid(event as Stripe.InvoicePaidEvent);
      default:
        return {
          provider: BillingProvider.STRIPE,
          eventId: event.id,
          kind: "unknown",
          orgId: "",
          subscriptionId: "",
        };
    }
  }

  private mapCheckoutCompleted(
    event: Stripe.CheckoutSessionCompletedEvent,
  ): ParsedBillingWebhookEvent {
    const session = event.data.object;
    const pendingOrderId = session.metadata?.pendingOrderId ?? null;
    const orgId = session.metadata?.orgId ?? "";
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id ?? "";
    const planCode = session.metadata?.planCode ?? null;

    return {
      provider: BillingProvider.STRIPE,
      eventId: event.id,
      kind: "subscription.created",
      orgId,
      subscriptionId,
      pendingOrderId,
      providerCheckoutId: session.id,
      planCode,
      status: SubscriptionStatus.ACTIVE,
    };
  }

  private mapSubscription(
    event:
      | Stripe.CustomerSubscriptionUpdatedEvent
      | Stripe.CustomerSubscriptionDeletedEvent,
    isCancel = false,
  ): ParsedBillingWebhookEvent {
    const sub = event.data.object;
    const pendingOrderId = sub.metadata?.pendingOrderId ?? null;
    const orgId = sub.metadata?.orgId ?? "";
    const planCode = sub.metadata?.planCode ?? null;
    return {
      provider: BillingProvider.STRIPE,
      eventId: event.id,
      kind: isCancel ? "subscription.canceled" : "subscription.updated",
      orgId,
      subscriptionId: sub.id,
      pendingOrderId,
      planCode,
      status: isCancel ? SubscriptionStatus.CANCELED : mapStripeStatus(sub.status),
      periodStart: sub.current_period_start
        ? new Date(sub.current_period_start * 1000)
        : null,
      periodEnd: sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end ?? null,
    };
  }

  private mapInvoicePaid(event: Stripe.InvoicePaidEvent): ParsedBillingWebhookEvent {
    const invoice = event.data.object;
    const subId =
      typeof invoice.subscription === "string"
        ? invoice.subscription
        : invoice.subscription?.id ?? "";
    const orgId = invoice.metadata?.orgId ?? "";
    const pendingOrderId = invoice.metadata?.pendingOrderId ?? null;

    return {
      provider: BillingProvider.STRIPE,
      eventId: event.id,
      kind: "invoice.paid",
      orgId,
      subscriptionId: subId,
      pendingOrderId,
      providerCheckoutId: invoice.metadata?.providerCheckoutId ?? null,
    };
  }
}

const mapStripeStatus = (
  status: string | null | undefined,
): SubscriptionStatus | null => {
  switch (status) {
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "past_due":
      return SubscriptionStatus.PAST_DUE;
    case "canceled":
      return SubscriptionStatus.CANCELED;
    case "incomplete":
      return SubscriptionStatus.INCOMPLETE;
    case "trialing":
      return SubscriptionStatus.TRIALING;
    default:
      return null;
  }
};

