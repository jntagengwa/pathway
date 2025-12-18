# PathWay Buy Now Flow (Option A)
## Full Strategist Spec plus CTO Technical Improvements plus Epic Breakdown (Single Copy Paste Doc)

> Use this as the single source for your Cursor prompt writer.  
> Principle: backend is the source of truth for catalog, totals, eligibility, and entitlement snapshots.

---

## 1) Strategist Spec (Verbatim Structure, Implementation Oriented)

### 1.1 Goal
Create a “Buy Now” flow that:
- Sells one base plan (Starter, Growth, Enterprise contact).
- Allows optional capacity add-ons (primarily AV30 blocks; also SMS, storage, export blocks if enabled).
- Produces a deterministic entitlement snapshot for the org.
- Integrates with existing billing workflow (checkout session + webhook + idempotency).
- Presents AV30 clearly: “Active People (last 30 days)”.

---

### 1.2 Page IA and Layout

#### Section A: Plan selection (top)
Plan cards (radio selection):
- Starter
- Growth
- Enterprise or Trust (CTA = “Contact sales”)

Each card includes:
- Price toggle: Monthly or Yearly
- Core included caps:
  - Included AV30
  - Included sites
  - Optional included storage, exports, SMS if you want it visible
- Baseline feature bullets
  - Safeguarding + mobile + offline attendance are for all tiers, so keep bullets short and consistent

Example card content:
- Starter
  - £149 per month or £1,490 per year
  - Includes 50 Active People (AV30)
  - Includes 1 site
- Growth
  - £399 per month or £3,990 per year
  - Includes 200 Active People (AV30)
  - Includes 3 sites

Enterprise card:
- “Custom pricing”
- “Contact sales” button
- No checkout

#### Section B: Add-ons (appears after plan selection)
Block based add-ons, each with:
- Name
- Unit size (example: +25 AV30)
- Price per unit (monthly and annual)
- Quantity stepper (0..N)
- “New cap” preview

Add-ons list (MVP)
1) AV30 blocks
- Starter plan: unit = +25, price = £39 per month or £390 per year
- Growth plan: unit = +50, price = £59 per month or £590 per year
- You can show unit/price based on selected plan or keep universal units
- Easiest UI is plan specific units

2) Optional (can be hidden until ready)
- Storage +100GB (£25 per month or £250 per year)
- Export jobs +500 per month (£40 per month or £400 per year)
- SMS packs (1k, 5k, 20k)

#### Section C: Order summary (sticky right column)
Shows:
- Selected plan
- Billing cadence (monthly or yearly)
- Base price
- Add-ons list with quantities
- “Total AV30 cap” and “Total sites cap” computed
- Total price today
- VAT line optional (often deferred to checkout)

Buttons:
- Primary: Continue to checkout
- Secondary: Need help? link

---

### 1.3 UX Copy (final copy you can lift)

#### AV30 explainer (tooltip or helper)
Active People (AV30) = unique staff and volunteers who were active in the last 30 days.  
If you go over your cap, we warn you first. If you remain over the limit, you may be temporarily prevented from publishing new rotas, sessions, assignments, or announcements until you add more capacity.

#### Add-on line item wording
+25 Active People (AV30) — £39 per month (or £390 per year)  
New AV30 cap: 75 (when quantity = 1)

#### Grace messaging (optional modal or info banner in app)
If you’ve already encoded soft, grace, hard:
- Soft cap banner: “You’re at 100% of your Active People limit. Add capacity to avoid disruption.”
- Grace banner: “You’re in a grace period (up to 14 days). Add capacity to continue publishing without interruption.”
- Hard cap banner: “Publishing is paused because you’re above your limit. Add capacity to resume.”

---

### 1.4 Data model expectations (minimal)

#### A) Price catalog objects
Need a stable catalog so the frontend doesn’t hardcode amounts.

PlanPrice
- planCode (STARTER | GROWTH)
- billingCadence (MONTHLY | ANNUAL)
- amountPence
- currency (“GBP”)
- providerPriceId (Stripe or other provider price id)
- includedEntitlements (JSON snapshot or references)

AddonPrice
- addonCode (AV30_BLOCK_25, AV30_BLOCK_50, STORAGE_100GB, EXPORT_500, SMS_1000 …)
- billingCadence
- amountPence
- currency
- providerPriceId
- unit (example: av30Increment = 25)
- eligibility (which plans can buy which addon)

#### B) Order draft (client side and server side)
On selection, build:
- planCode
- billingCadence
- addons: [{ addonCode, qty }]

On server:
- Validate plan and add-on eligibility
- Convert to provider line items
- Create checkout session
- Store pendingOrder keyed by checkoutSessionId

---

### 1.5 Entitlement computation (important)

You already have entitlements per org plus snapshots. This flow should create or update them deterministically.

Inputs:
- Selected plan baseline:
  - Starter base: av30Included = 50, sites = 1, etc
  - Growth base: av30Included = 200, sites = 3, etc
- Add-on quantities:
  - Starter AV30 blocks: +25 each
  - Growth AV30 blocks: +50 each

Output:
OrgEntitlementSnapshot computed as:
- av30Cap = baseAv30 + (qty * unitIncrement)
- sitesCap = baseSites + (siteAddons if any)
- storageGbCap = baseStorage + (qtyStorage * 100)
- exportJobsCap = baseExport + (qtyExport * 500)
- smsUnitsCap = baseSms + (smsPackUnits * qty)

Feature flags, since safeguarding, mobile, offline are for all tiers:
- feature.safeguarding = true
- feature.mobile = true (when live)
- feature.offlineAttendance = true (when live)

Depth knobs (if used):
- auditRetentionDays and reportingLevel still vary by tier

When to apply entitlements:
- On successful billing webhook (“checkout completed” or “subscription created”):
  - Upsert subscription
  - Create new entitlement snapshot (effective immediately)
  - Log billing event idempotently

---

### 1.6 Pricing math (front-end display)

Cadence rules:
- Monthly price shown as is.
- Annual price shown as monthly × 10 (2 months free equivalent).
- Add-ons follow same cadence.

Derived values to display:
- displayAv30Cap = computed cap
- displayTotalPrice = plan + sum(add-ons)
- displayAnnualSavings (optional) = (monthly × 12) − annual

Example (Starter + 1 AV30 block):
- Starter monthly: £149
- Add-on +25: £39
- Total: £188 per month
- AV30 cap: 75

---

### 1.7 Validation and edge cases

Frontend validation:
- Quantity cannot be negative.
- Cap preview updates instantly.
- If Enterprise selected: hide add-ons and show “Contact sales”.

Backend validation:
- Ensure add-ons are allowed for that plan.
- Ensure billing cadence matches all line items (don’t mix monthly and annual).
- Idempotency on webhook handling.

Plan change scenarios (later):
- Upgrade Starter to Growth: convert AV30 blocks to nearest equivalent, or reset add-ons.
- Cancel add-ons mid-cycle: apply at next renewal or prorate depending on provider.
For MVP:
- Support upgrades through the same checkout flow; apply changes on webhook.

---

### 1.8 API endpoints (suggested)

GET /billing/catalog  
Returns:
- plans (with monthly + annual price ids, included caps)
- add-ons (with cadence, eligibility, unit sizes)

POST /billing/checkout  
Body:
```json
{
  "orgId": "org_123",
  "planCode": "STARTER",
  "billingCadence": "MONTHLY",
  "addons": [
    { "addonCode": "AV30_BLOCK_25", "qty": 1 }
  ]
}
```
Returns:
```json
{ "checkoutUrl": "https://..." }
```

Webhook already exists:
- Continue to use it to finalize subscription + entitlements.

---

### 1.9 UI states and components

Components:
- PlanCardRadioGroup
- BillingCadenceToggle
- AddonStepperList
- OrderSummarySticky
- Av30Tooltip

States:
- Loading catalog
- Catalog error fallback
- Checkout creation pending
- Checkout error
- Enterprise “contact sales” state

---

### 1.10 Analytics (lightweight but valuable)
Track:
- Plan selected
- Cadence selected
- Add-on quantities changed
- Checkout started, completed, canceled

Goal:
- Identify drop off at pricing and whether default AV30 caps are too low.

---

## 2) CTO Technical Improvements (Make it robust, secure, deterministic)

### 2.1 Backend is the source of truth for annual pricing
Do not compute annual as monthly × 10 in the frontend or the backend at runtime.
- Keep the “2 months free equivalent” as a marketing label.
- The catalog should store the exact monthly and annual amounts and provider price IDs.
- This prevents mismatches when pricing changes, promotions exist, VAT handling changes, or provider proration differs.

### 2.2 Catalog versioning for safe rollout and deterministic fulfillment
Add a `PriceCatalog` version and require all checkouts to pin to a catalog version.
- Checkout stores `catalogVersion` and `providerPriceId` line items used.
- Webhook fulfillment applies the stored entitlements snapshot from PendingOrder, not recomputed from the current catalog.

### 2.3 Server computed quote and entitlement preview
Even if UI shows instant previews, final caps and totals must be computed server-side.
Recommended patterns:
- Minimal: `POST /billing/checkout` returns `{ checkoutUrl, quote }`.
- Stronger separation: `POST /billing/quote` then `POST /billing/checkout`.
Either way:
- Validate eligibility and cadence.
- Compute entitlements and totals on the server.
- Return a quote payload for the UI summary.

### 2.4 Do not trust orgId from the client
For security:
- Infer orgId from the authenticated session and org context.
- If you keep `orgId` in the request body for compatibility, validate that the caller is an admin of that org.

### 2.5 PendingOrder is mandatory for deterministic webhook application
Store a `PendingOrder` keyed by `checkoutSessionId`, containing:
- orgId, planCode, billingCadence
- selected addons and quantities
- catalogVersion
- provider line items (price IDs and qty)
- computed entitlements JSON snapshot
- status transitions (PENDING, FULFILLED, CANCELED, EXPIRED)

Webhook logic:
- Find PendingOrder by checkoutSessionId
- If already fulfilled, no-op
- Apply stored snapshot in a transaction
- Log idempotently

### 2.6 Plan change rules (MVP safe defaults)
MVP recommendation:
- Support upgrades via the same checkout flow.
- When upgrading Starter to Growth, require user to reselect add-ons, do not attempt automatic conversion.
Later:
- Implement conversion rules.

### 2.7 Add-on unit strategy should be catalog driven
Two safe options:
- Separate addon codes:
  - `AV30_BLOCK_25` eligible only for Starter
  - `AV30_BLOCK_50` eligible only for Growth
- Or a single addon code with unitByPlan, enforced in quote service
Prefer separate addon codes for simplicity and fewer edge cases.

### 2.8 GDPR friendly analytics
Track without PII:
- orgId internal identifier
- anonymous session identifier
- event type and payload containing planCode, cadence, addon quantities
Make analytics optional by config.

---

## 3) Recommended Data Model (Prisma Friendly)

### 3.1 Catalog models
PriceCatalog
- id
- version (string, unique)
- isActive (boolean)
- publishedAt (datetime)
- effectiveFrom (datetime)

PlanPrice
- id
- catalogId (FK)
- planCode (enum STARTER, GROWTH)
- billingCadence (enum MONTHLY, ANNUAL)
- amountPence (int)
- currency (string, GBP)
- providerPriceId (string)
- includedEntitlementsJson (json)

AddonPrice
- id
- catalogId (FK)
- addonCode (enum or string)
- billingCadence (MONTHLY, ANNUAL)
- amountPence
- currency
- providerPriceId
- unitJson (json, example { av30Increment: 25 })
- eligibilityJson (json, example { plans: ["STARTER"] })

### 3.2 Pending order model
PendingOrder
- id
- orgId
- checkoutSessionId (unique)
- catalogVersion
- planCode
- billingCadence
- addonsJson
- providerLineItemsJson
- computedEntitlementsJson
- status (PENDING, FULFILLED, CANCELED, EXPIRED)
- createdAt
- fulfilledAt (nullable)

---

## 4) API Contracts (Cursor Ready)

### 4.1 GET /billing/catalog
Response example:
```json
{
  "version": "2025-12-16.1",
  "currency": "GBP",
  "plans": [
    {
      "planCode": "STARTER",
      "displayName": "Starter",
      "prices": {
        "MONTHLY": { "amountPence": 14900, "providerPriceId": "price_starter_monthly" },
        "ANNUAL": { "amountPence": 149000, "providerPriceId": "price_starter_annual" }
      },
      "included": { "av30": 50, "sites": 1 },
      "features": { "safeguarding": true, "mobile": true, "offlineAttendance": true }
    },
    {
      "planCode": "GROWTH",
      "displayName": "Growth",
      "prices": {
        "MONTHLY": { "amountPence": 39900, "providerPriceId": "price_growth_monthly" },
        "ANNUAL": { "amountPence": 399000, "providerPriceId": "price_growth_annual" }
      },
      "included": { "av30": 200, "sites": 3 },
      "features": { "safeguarding": true, "mobile": true, "offlineAttendance": true }
    }
  ],
  "addons": [
    {
      "addonCode": "AV30_BLOCK_25",
      "displayName": "+25 Active People (AV30)",
      "eligibility": { "plans": ["STARTER"] },
      "unit": { "av30Increment": 25 },
      "prices": {
        "MONTHLY": { "amountPence": 3900, "providerPriceId": "price_av30_25_monthly" },
        "ANNUAL": { "amountPence": 39000, "providerPriceId": "price_av30_25_annual" }
      }
    },
    {
      "addonCode": "AV30_BLOCK_50",
      "displayName": "+50 Active People (AV30)",
      "eligibility": { "plans": ["GROWTH"] },
      "unit": { "av30Increment": 50 },
      "prices": {
        "MONTHLY": { "amountPence": 5900, "providerPriceId": "price_av30_50_monthly" },
        "ANNUAL": { "amountPence": 59000, "providerPriceId": "price_av30_50_annual" }
      }
    }
  ]
}
```

### 4.2 POST /billing/checkout
Request:
```json
{
  "planCode": "STARTER",
  "billingCadence": "MONTHLY",
  "addons": [
    { "addonCode": "AV30_BLOCK_25", "qty": 1 }
  ]
}
```

Response:
```json
{
  "checkoutUrl": "https://provider/checkout/...",
  "checkoutSessionId": "cs_123",
  "quote": {
    "totalAmountPence": 18800,
    "currency": "GBP",
    "lineItems": [
      { "code": "STARTER", "qty": 1, "amountPence": 14900 },
      { "code": "AV30_BLOCK_25", "qty": 1, "amountPence": 3900 }
    ],
    "entitlements": {
      "av30Cap": 75,
      "sitesCap": 1,
      "feature": {
        "safeguarding": true,
        "mobile": true,
        "offlineAttendance": true
      }
    }
  }
}
```

Error shape:
```json
{ "code": "ADDON_NOT_ELIGIBLE", "message": "Selected add-on is not available for this plan." }
```

Backend rules:
- Do not allow mixed cadence
- Do not allow checkout for Enterprise plan
- Org context inferred from session (orgId is not trusted from body)

### 4.3 Webhook fulfillment
Inputs:
- provider event includes checkoutSessionId and subscription identifiers

Process:
- Fetch PendingOrder by checkoutSessionId
- Transaction:
  - Upsert Subscription
  - Write entitlement snapshot from PendingOrder
  - Mark PendingOrder fulfilled
  - Write BillingEvent idempotently

---

## 5) Frontend Implementation Notes (Next.js)

### 5.1 Components
- PlanCardRadioGroup
- BillingCadenceToggle
- AddonStepperList
- OrderSummarySticky
- Av30Tooltip

### 5.2 Page states
- Loading catalog
- Catalog error fallback with retry
- Quote loading state (if quote is separate call or returned during checkout)
- Checkout creation pending
- Checkout error
- Enterprise contact sales state

### 5.3 UX rules
- If Enterprise selected:
  - Hide add-ons
  - Show contact sales CTA
  - Continue to checkout disabled
- Quantity stepper:
  - min 0
  - optional max N, enforce on backend too
- Summary:
  - Always display computed caps and total derived from server quote where possible
  - Do not display confusing VAT estimates unless you have a clear rule

---

## 6) Analytics Events (Lightweight, GDPR Friendly)

Track events:
- plan_selected
- cadence_selected
- addon_qty_changed
- checkout_started
- checkout_completed
- checkout_canceled

Payload guidance:
- orgId internal
- planCode
- billingCadence
- addons summary (codes + qty)
- catalogVersion
- Do not include PII

---

## 7) Epic Breakdown (For Engineering Execution)

### EPIC 1: Pricing Catalog and Quote Engine
Goal:
- Backend provides catalog and server computed quote and entitlements.

Deliverables:
- PriceCatalog, PlanPrice, AddonPrice tables
- GET /billing/catalog
- BillingQuoteService that validates and computes totals and entitlements

Acceptance criteria:
- Monthly and annual prices come from catalog
- Server enforces eligibility and cadence rules
- Quote output includes caps and totals and matches what checkout charges

Tasks:
- Implement catalog schema and seeding
- Implement active catalog resolution and caching
- Implement quote computation
- Add endpoint and tests

---

### EPIC 2: Buy Now Page UI (Option A)
Goal:
- Build plan selection + add-ons + sticky summary driven by catalog.

Acceptance criteria:
- Catalog loads and error states handled
- Enterprise state shows contact sales and hides add-ons
- Cap preview updates instantly and is consistent with server rules

Tasks:
- Create /buy route page
- Implement components
- Hook to GET /billing/catalog
- Handle local selection state and preview logic

---

### EPIC 3: Checkout Creation and Pending Orders
Goal:
- Convert selection into provider line items, create checkout session, persist PendingOrder.

Acceptance criteria:
- POST /billing/checkout validates everything
- PendingOrder stores catalogVersion, selected addons, provider line items, computed entitlements snapshot
- Cannot checkout enterprise

Tasks:
- Implement checkout mapping to provider line items
- Persist PendingOrder
- Return checkoutUrl and quote
- Add rate limiting on checkout endpoint

---

### EPIC 4: Webhook Fulfillment and Entitlement Application
Goal:
- Apply entitlements deterministically and idempotently on webhook.

Acceptance criteria:
- Uses PendingOrder snapshot
- Idempotent on retries and duplicate events
- Transaction ensures subscription and snapshot consistency

Tasks:
- Webhook handler resolves PendingOrder
- Apply snapshot and mark fulfilled
- BillingEvent idempotency tests
- Observability logs for eventId, orgId, checkoutSessionId

---

### EPIC 5: In-app Cap Messaging (Soft, Grace, Hard)
Goal:
- Surface AV30 usage and enforcement states with CTA to Buy Now.

Acceptance criteria:
- Correct banner shown for soft cap, grace, hard cap
- CTA routes to /buy in correct org context

Tasks:
- Endpoint to fetch usage and caps (billing status)
- Frontend banner component and rules
- Link to buy flow

---

### EPIC 6: Plan Change Scenarios (MVP Upgrade Path)
Goal:
- Support upgrades via Buy Now flow safely.

MVP rule:
- Upgrades supported
- Downgrades and mid-cycle removals deferred
- Starter to Growth requires reselect add-ons

Acceptance criteria:
- Upgrade applies correct new snapshot on webhook
- Clear messaging for unsupported changes

Tasks:
- Validation rules in quote and checkout
- Provider subscription update approach decision (new checkout vs portal later)

---

### EPIC 7: Analytics Implementation
Goal:
- Track funnel and plan capacity signals without PII.

Acceptance criteria:
- Events recorded with orgId and selection summary
- Config can disable analytics

Tasks:
- Frontend emit wrapper
- Backend ingestion or self-hosted event storage
- Dashboard queries for conversion funnel

---

### EPIC 8: QA, Security, and Ops Readiness
Goal:
- Prevent billing regressions and ensure safe rollout.

Acceptance criteria:
- Unit tests cover quote computation
- End to end tests cover Starter and Growth monthly and annual, invalid addon combos, Enterprise contact state
- Webhook replay test passes
- Runbook exists for webhook failures and PendingOrder stuck

Tasks:
- Implement test matrix
- Add structured logging for billing paths
- Add alerts for webhook failure rates

---

## 8) Suggested Folder Placement (Monorepo)
Frontend:
- apps/web/app/(marketing)/buy/page.tsx
- apps/web/components/billing/*

Backend:
- apps/api/src/modules/billing/*
  - billing.controller.ts
  - billing.catalog.service.ts
  - billing.quote.service.ts
  - billing.checkout.service.ts
  - billing.webhook.service.ts (or integrate with existing)
- packages/shared/src/billing/*
  - plan-code.ts
  - addon-code.ts
  - billing-cadence.ts
  - dto types

---

## 9) Prompter Notes (What to tell Cursor explicitly)
- Implement epics in order: EPIC 1, EPIC 2, EPIC 3, EPIC 4, then EPIC 5 to EPIC 8.
- Backend is source of truth for totals and entitlement snapshots.
- PendingOrder stores computed entitlements snapshot and provider price IDs; webhook applies stored snapshot.
- Do not compute annual pricing at runtime; store explicit monthly and annual prices in catalog.
- Do not trust orgId from the client; infer from session.
- Use feature flags to hide optional add-ons until ready.
