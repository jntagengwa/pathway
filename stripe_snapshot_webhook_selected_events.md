# Stripe “Snapshot” webhook — selected event types (Pathway)

Captured from: **Stripe Dashboard → Workbench → Webhooks → Edit destination (Snapshot payload style)**  
Destination name: **brilliant-serenity-snapshot**  
Endpoint URL: `https://api.nexsteps.dev/stripe/webhooks/snapshot`  
API version: `2025-08-27.basil`  
Captured on: **19 Dec 2025 (GMT)**

> Stripe shows **“Selected events: 99”** for this destination.  
> This file lists **all event types visible in the page content provided**. If additional categories/events are selected further down the page (not included in the captured content), they won’t appear here.

**PathWay usage:** This snapshot webhook is the **only** Stripe endpoint that drives billing/entitlements. Configure Stripe to send these six events here and verify with `STRIPE_WEBHOOK_SECRET_SNAPSHOT`:  
`checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`.

---

## Billing Portal

- `billing_portal.configuration.created` — Occurs whenever a portal configuration is created.
- `billing_portal.configuration.updated` — Occurs whenever a portal configuration is updated.
- `billing_portal.session.created` — Occurs whenever a portal session is created.

## Billing

- `billing.alert.triggered` — Occurs whenever your custom alert threshold is met.
- `billing.credit_balance_transaction.created` — Occurs when a credit balance transaction is created.
- `billing.credit_grant.created` — Occurs when a credit grant is created.
- `billing.credit_grant.updated` — Occurs when a credit grant is updated.
- `billing.meter.created` — Occurs when a meter is created.
- `billing.meter.deactivated` — Occurs when a meter is deactivated.
- `billing.meter.reactivated` — Occurs when a meter is reactivated.
- `billing.meter.updated` — Occurs when a meter is updated.

## Charge

- `charge.captured` — Occurs whenever a previously uncaptured charge is captured.
- `charge.expired` — Occurs whenever an uncaptured charge expires.
- `charge.failed` — Occurs whenever a failed charge attempt occurs.
- `charge.pending` — Occurs whenever a pending charge is created.
- `charge.refunded` — Occurs whenever a charge is refunded, including partial refunds. Listen to `refund.created` for information about the refund.
- `charge.succeeded` — Occurs whenever a charge is successful.
- `charge.updated` — Occurs whenever a charge description or metadata is updated, or upon an asynchronous capture.
- `charge.dispute.closed` — Occurs when a dispute is closed and the dispute status changes to lost, warning_closed, or won.
- `charge.dispute.created` — Occurs whenever a customer disputes a charge with their bank.
- `charge.dispute.funds_reinstated` — Occurs when funds are reinstated to your account after a dispute is closed (includes partially refunded payments).
- `charge.dispute.funds_withdrawn` — Occurs when funds are removed from your account due to a dispute.
- `charge.dispute.updated` — Occurs when the dispute is updated (usually with evidence).
- `charge.refund.updated` — Occurs whenever a refund is updated on selected payment methods. For updates on all refunds, listen to `refund.updated` instead.

## Coupon

- `coupon.created` — Occurs whenever a coupon is created.
- `coupon.deleted` — Occurs whenever a coupon is deleted.
- `coupon.updated` — Occurs whenever a coupon is updated.

## Customer

- `customer.created` — Occurs whenever a new customer is created.
- `customer.deleted` — Occurs whenever a customer is deleted.
- `customer.updated` — Occurs whenever any property of a customer changes.
- `customer.discount.created` — Occurs whenever a coupon is attached to a customer.
- `customer.discount.deleted` — Occurs whenever a coupon is removed from a customer.
- `customer.discount.updated` — Occurs whenever a customer is switched from one coupon to another.
- `customer.source.created` — Occurs whenever a new source is created for a customer.
- `customer.source.deleted` — Occurs whenever a source is removed from a customer.
- `customer.source.expiring` — Occurs whenever a card or source will expire at the end of the month (legacy Card/Source integrations).
- `customer.source.updated` — Occurs whenever a source’s details are changed.
- `customer.subscription.created` — Occurs whenever a customer is signed up for a new plan.
- `customer.subscription.deleted` — Occurs whenever a customer’s subscription ends.
- `customer.subscription.paused` — Occurs whenever a customer’s subscription is paused (status=paused only).
- `customer.subscription.pending_update_applied` — Occurs whenever a subscription’s pending update is applied and the subscription is updated.
- `customer.subscription.pending_update_expired` — Occurs whenever a subscription’s pending update expires before the related invoice is paid.
- `customer.subscription.resumed` — Occurs whenever a subscription is no longer paused (status=paused resumed only).
- `customer.subscription.trial_will_end` — Occurs three days before a subscription’s trial is scheduled to end, or when a trial is ended immediately (`trial_end=now`).
- `customer.subscription.updated` — Occurs whenever a subscription changes (e.g., plan switch, trial → active).
- `customer.tax_id.created` — Occurs whenever a tax ID is created for a customer.
- `customer.tax_id.deleted` — Occurs whenever a tax ID is deleted from a customer.
- `customer.tax_id.updated` — Occurs whenever a customer’s tax ID is updated.

## Invoice Payment

- `invoice_payment.paid` — Occurs when an InvoicePayment is successfully paid.

## Invoice

- `invoice.created` — Occurs whenever a new invoice is created.
- `invoice.deleted` — Occurs whenever a draft invoice is deleted.
- `invoice.finalization_failed` — Occurs whenever a draft invoice cannot be finalized.
- `invoice.finalized` — Occurs whenever a draft invoice is finalized and updated to be an open invoice.
- `invoice.marked_uncollectible` — Occurs whenever an invoice is marked uncollectible.
- `invoice.overdue` — Occurs X days after an invoice becomes due (X determined by Automations).
- `invoice.overpaid` — Occurs when an invoice transitions to paid with a non-zero `amount_overpaid`.
- `invoice.paid` — Occurs whenever an invoice payment attempt succeeds or an invoice is marked as paid out-of-band.
- `invoice.payment_action_required` — Occurs whenever an invoice payment attempt requires further user action to complete.
- `invoice.payment_attempt_required` — Occurs when an invoice requires payment using a payment method that cannot be processed by Stripe.
- `invoice.payment_failed` — Occurs whenever an invoice payment attempt fails (declined payment, soft decline, or missing stored payment method).
- `invoice.payment_succeeded` — Occurs whenever an invoice payment attempt succeeds.
- `invoice.sent` — Occurs whenever an invoice email is sent out.
- `invoice.upcoming` — Occurs X days before a subscription is scheduled to create an automatically charged invoice (X determined by subscription settings). Note: received Invoice object will not have an invoice ID.
- `invoice.updated` — Occurs whenever an invoice changes (e.g., invoice amount).
- `invoice.voided` — Occurs whenever an invoice is voided.
- `invoice.will_be_due` — Occurs X days before an invoice becomes due (X determined by Automations).

## Payment Method

- `payment_method.attached` — Occurs whenever a new payment method is attached to a customer.
- `payment_method.automatically_updated` — Occurs whenever a payment method’s details are automatically updated by the network.
- `payment_method.detached` — Occurs whenever a payment method is detached from a customer.
- `payment_method.updated` — Occurs whenever a payment method is updated via the PaymentMethod update API.

## Person

- `person.created` — Occurs whenever a person associated with an account is created.
- `person.deleted` — Occurs whenever a person associated with an account is deleted.
- `person.updated` — Occurs whenever a person associated with an account is updated.

## Plan

- `plan.created` — Occurs whenever a plan is created.
- `plan.deleted` — Occurs whenever a plan is deleted.
- `plan.updated` — Occurs whenever a plan is updated.

## Product

- `product.created` — Occurs whenever a product is created.
- `product.deleted` — Occurs whenever a product is deleted.
- `product.updated` — Occurs whenever a product is updated.

## Refund

- `refund.created` — Occurs whenever a refund is created.
- `refund.failed` — Occurs whenever a refund has failed.
- `refund.updated` — Occurs whenever a refund is updated.

## Reporting

- `reporting.report_type.updated` — Occurs whenever a ReportType is updated (typically indicates a new day’s data is available).
- `reporting.report_run.failed` — Occurs whenever a requested ReportRun failed to complete.
- `reporting.report_run.succeeded` — Occurs whenever a requested ReportRun completed successfully.

## Subscription Schedule

- `subscription_schedule.aborted` — Occurs whenever a subscription schedule is canceled due to the underlying subscription being canceled because of delinquency.
- `subscription_schedule.canceled` — Occurs whenever a subscription schedule is canceled.
- `subscription_schedule.completed` — Occurs whenever a new subscription schedule is completed.
- `subscription_schedule.created` — Occurs whenever a new subscription schedule is created.
- `subscription_schedule.expiring` — Occurs 7 days before a subscription schedule will expire.
- `subscription_schedule.released` — Occurs whenever a new subscription schedule is released.
- `subscription_schedule.updated` — Occurs whenever a subscription schedule is updated.
