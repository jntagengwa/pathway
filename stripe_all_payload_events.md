# Stripe Workbench events (Pathway)

Date captured: **19 Dec 2025 (GMT)**  
Source: Stripe Dashboard → Workbench → Events (Pathway)

This document lists the **event types visible in Workbench** and a **thin payload** shape for each (the minimal fields we should persist / pass through internal “BillingEvent” style records).  
Where useful, it also notes **what to extract** and **why**.

---

## Conventions

### Event envelope (common to all)

Store these top-level fields for **every** event:

- `id` (event id, e.g. `evt_...`)
- `type` (e.g. `product.updated`)
- `created` (Unix seconds) or `origin_date` as ISO string
- `livemode` (boolean)
- `api_version` (e.g. `2025-08-27.basil`)
- `request.id` (if present in the event)
- `data.object.id` + `data.object.object` (primary resource id + type)

> **Thin payload rule:** Persist only what you need to run idempotent processing, reconcile Stripe state, and debug safely. Avoid storing large nested objects unless required.

### Resource pointer (recommended internal model)

For all events, normalize a resource pointer:

```json
{
  "resource": {
    "type": "product|price|subscription|invoice|checkout_session|customer|...",
    "id": "prod_...|price_...|..."
  }
}
```

---

## Events observed in Workbench

### 1) `product.created`

**What this indicates:** A new Product was created.

**Thin payload (recommended):**

```json
{
  "event": {
    "id": "evt_...",
    "type": "product.created",
    "created": 1766145326,
    "livemode": true,
    "api_version": "2025-08-27.basil"
  },
  "resource": { "type": "product", "id": "prod_..." },
  "product": {
    "id": "prod_...",
    "active": true,
    "name": "SMS Bundle (1,000)",
    "description": "Adds 1,000 SMS credits per billing period.",
    "default_price": "price_...",
    "tax_code": "txcd_10000000",
    "updated": 1766145327
  }
}
```

**Extract / use:**

- `product.id`, `name`, `default_price`, `tax_code`, `active`
- Useful to keep Stripe catalog mirrored in your DB for admin UX and reconciliation.

---

### 2) `product.updated`

**What this indicates:** A Product changed (name/description/default_price/etc).

**Workbench example context (from the page):**

- Event: `product.updated`
- Description: “A product with ID `prod_TdIt8mNrVnT6lf` was updated”
- Fields shown in `data.object`:
  - `id`: `prod_TdIt8mNrVnT6lf`
  - `active`: `true`
  - `created`: `1766145326`
  - `default_price`: `price_1Sg2HKBMRfS2BI50jtKGEC6k`
  - `description`: `"Adds 1,000 SMS credits per billing period."`
  - `name`: `"SMS Bundle (1,000)"`
  - `tax_code`: `"txcd_10000000"`
  - `type`: `"service"`
  - `updated`: `1766145327`
- `previous_attributes` shown:
  - `default_price`: `null`
  - `updated`: `1766145326`

**Thin payload (recommended):**

```json
{
  "event": {
    "id": "evt_1Sg2HLBMRfS2BI503o7ZGXlc",
    "type": "product.updated",
    "created": 1766145327,
    "livemode": true,
    "api_version": "2025-08-27.basil"
  },
  "resource": { "type": "product", "id": "prod_TdIt8mNrVnT6lf" },
  "product": {
    "id": "prod_TdIt8mNrVnT6lf",
    "active": true,
    "name": "SMS Bundle (1,000)",
    "description": "Adds 1,000 SMS credits per billing period.",
    "default_price": "price_1Sg2HKBMRfS2BI50jtKGEC6k",
    "tax_code": "txcd_10000000",
    "type": "service",
    "updated": 1766145327
  },
  "previous": {
    "default_price": null,
    "updated": 1766145326
  }
}
```

**Extract / use:**

- Update your local “Product mirror” record (by `product.id`)
- If `default_price` changed, you may want to refresh the price mirror too.

---

### 3) `price.created`

**What this indicates:** A new Price was created (recurring/one-off, currency, amount).

**Thin payload (recommended):**

```json
{
  "event": {
    "id": "evt_...",
    "type": "price.created",
    "created": 1766145326,
    "livemode": true,
    "api_version": "2025-08-27.basil"
  },
  "resource": { "type": "price", "id": "price_..." },
  "price": {
    "id": "price_...",
    "product": "prod_...",
    "active": true,
    "currency": "gbp",
    "unit_amount": 0,
    "recurring": {
      "interval": "month",
      "interval_count": 1
    },
    "tax_behavior": "unspecified|inclusive|exclusive",
    "lookup_key": "addon_sms_1000_monthly_gbp"
  }
}
```

**Extract / use:**

- `price.id`, `product`, `currency`, `unit_amount` / `unit_amount_decimal`, `recurring.interval`, `recurring.interval_count`
- `lookup_key` (if you set it) is _very_ useful for deterministic mapping in code.

---

### 4) `plan.created` (legacy surface)

**What this indicates:** Stripe emitted `plan.created` alongside `price.created` in Workbench.

Stripe’s modern billing primitives are **Prices**; “Plans” exist as a legacy surface and may appear in events for compatibility.

**Thin payload (recommended):**

```json
{
  "event": {
    "id": "evt_...",
    "type": "plan.created",
    "created": 1766145326,
    "livemode": true,
    "api_version": "2025-08-27.basil"
  },
  "resource": { "type": "price", "id": "price_..." },
  "plan": {
    "id": "price_...",
    "product": "prod_...",
    "currency": "gbp",
    "amount": 0,
    "interval": "month",
    "interval_count": 1
  }
}
```

**Extract / use:**

- You can safely treat this as an alias of `price.created` for your internal processing
- Prefer `price.*` fields as the source of truth

---

## What to do with these thin payloads in Pathway

### Suggested internal table shape (example)

Use a single table/stream like `BillingEvent` / `StripeEvent`:

```json
{
  "id": "evt_...",
  "provider": "stripe",
  "type": "product.updated",
  "createdAt": "2025-12-19T11:55:27Z",
  "livemode": true,
  "apiVersion": "2025-08-27.basil",
  "resourceType": "product",
  "resourceId": "prod_...",
  "payloadThin": { "...": "..." },
  "processedAt": "2025-12-19T11:56:10Z",
  "processingError": null
}
```

### Idempotency

- Use Stripe `event.id` as your primary idempotency key.
- Store `processedAt` to make handlers safe to re-run.

### Data minimization

- Don’t store full customer PII unless strictly needed.
- For catalog events (product/price), the thin payload above is usually sufficient.

---

## Recommended next: billing-critical webhooks (not visible in this Workbench slice)

The page you shared shows **catalog events**. For production billing you will almost certainly want these too:

- `checkout.session.completed`
- `customer.subscription.created|updated|deleted`
- `invoice.paid`
- `invoice.payment_failed`
- `payment_intent.succeeded|payment_intent.payment_failed` (if you rely on PaymentIntents directly)

If you open your **Workbench → Webhooks** screen (or paste the webhook event list), I can add a second section with **exact thin payloads** for each of those billing events (including org/tenant mapping fields).

---
