# Stripe “Thin” webhook — selected event types (Pathway)

Captured from: **Stripe Dashboard → Workbench → Webhooks → Edit destination**  
Destination name: **brilliant-serenity-thin**  
Endpoint URL: `https://api.nexsteps.dev/stripe/webhooks/thin`  
Payload style: **Thin**  
Events selected: **11**  
Captured on: **19 Dec 2025 (GMT)**

This document lists **all events currently selected** for the *Thin* webhook destination, exactly as shown in the Stripe dashboard.

---

## Billing Meter (v1)

- `v1.billing.meter.error_report_triggered`  
  Occurs when a Meter has invalid async usage events.

- `v1.billing.meter.no_meter_found`  
  Occurs when a Meter’s ID is missing or invalid in async usage events.

---

## Received Credit (v2)

- `v2.money_management.received_credit.available`  
  Occurs when a ReceivedCredit’s funds are received and are available in your balance.

- `v2.money_management.received_credit.failed`  
  Occurs when a ReceivedCredit is attempted to your balance and fails.  
  See `status_details` for more information.

- `v2.money_management.received_credit.returned`  
  Occurs when a ReceivedCredit is reversed, returned to the originator, and deducted from your balance.

- `v2.money_management.received_credit.succeeded`  
  Occurs when a ReceivedCredit succeeds.

---

## Received Debit (v2)

- `v2.money_management.received_debit.canceled`  
  Occurs when a ReceivedDebit is canceled.

- `v2.money_management.received_debit.failed`  
  Occurs when a ReceivedDebit fails.

- `v2.money_management.received_debit.pending`  
  Occurs when a ReceivedDebit is set to pending.

- `v2.money_management.received_debit.succeeded`  
  Occurs when a ReceivedDebit succeeds.

- `v2.money_management.received_debit.updated`  
  Occurs when a ReceivedDebit is updated.

---

## Notes for Pathway implementation

- These events are **low-volume, system/billing integrity signals**, well-suited to the *Thin* payload style.
- Recommended handling pattern:
  - Store `event.id`, `event.type`, `created`, and minimal `resource.id`
  - Log and alert on:
    - `billing.meter.*` errors (misconfigured AV30 or async usage reporting)
    - `received_credit.failed`
    - `received_debit.failed`
- These events typically **do not require customer-facing UI updates**, but are critical for:
  - Billing correctness
  - Reconciliation
  - Observability & alerting

---

## Suggested internal routing

```ts
switch (event.type) {
  case "v1.billing.meter.error_report_triggered":
  case "v1.billing.meter.no_meter_found":
    // Alert + investigate metered usage pipeline
    break;

  case "v2.money_management.received_credit.failed":
  case "v2.money_management.received_debit.failed":
    // Flag finance / reconciliation issue
    break;

  default:
    // Persist + no-op
}
```

---
