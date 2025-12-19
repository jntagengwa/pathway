# PathWay Build Plan

> Working build plan for PathWay platform.
> Backend first, then admin UI, then mobile app.
> Keep this document close to code and update as we deliver.

---

## 0. Product snapshot

**Audience**

- Multi tenant SaaS for:
  - Schools and academies.
  - Clubs and holiday schemes.
  - Faith and community groups running children and youth programmes.

**Core use cases**

- Schedule sessions, rotas and groups for children and youth activities.
- Capture attendance quickly (including offline first mobile, then sync).
- Manage staff and volunteers:
  - Assign to sessions and roles.
  - Track safeguarding responsibilities.
- Safeguarding:
  - Notes and concerns.
  - Clear RBAC for who can see what.
  - DSAR export per child.
- Parent communications:
  - Notices and announcements to parents and staff.
- Billing:
  - Usage based on AV30 (unique active staff/volunteers in last 30 days).
  - Starter and Growth plans with caps and add ons.
  - Enterprise handled via sales and custom contracts.

**Non negotiables**

- Tenant isolation via Postgres Row Level Security.
- Safeguarding RBAC defined and enforced.
- GDPR and UK DPA aware:
  - DSAR exports.
  - Retention policy skeleton and jobs.
- Structured logging and observability by tenant and org.
- Simple, explainable pricing and entitlements.

---

## 1. Architecture overview

### 1.1 Stack

- Backend: NestJS app with Prisma, Postgres, RLS and multi tenant support.
- Admin: Next.js (App Router) admin UI using Tailwind and shadcn style components served as `apps/admin`.
- Mobile: React Native app (later epic) using the same API and design language.
- Workers: Node workers for AV30 computation, retention jobs and similar background tasks.
- Auth:
  - PathWayRequestContext carrying tenantId, orgId, userId, roles.
  - Guards for tenant/org RBAC and safeguarding.

### 1.2 Tenancy model

- Tenants: typically a trust or organisation that may own multiple orgs or sites.
- Orgs: individual school, club or site that holds children, staff and sessions.
- Users:
  - Staff / volunteers (serve access).
  - Parents / guardians (family access).
- RLS:
  - Enforced at DB level on all tenant bounded tables.
  - Guards enforce tenantId and orgId on all queries.

### 1.3 Billing model

- Meter: AV30 – unique staff/volunteers with activity in the last 30 days.
- Plans:
  - Starter (single site, lower AV30 cap).
  - Growth (higher AV30, more sites).
  - Enterprise / Trust (handled via sales).
- UsageCounters table tracks the AV30 metric per org per day.
- Entitlements service resolves caps, usage and flags for each org.
- Enforcement service guards core operations (sessions, assignments, announcements) on AV30 hard cap.
- Billing provider integration via webhook with idempotency and minimal logging.

---

## 2. Epic 1 – Multi tenant foundation, auth and RLS

**Status**: Delivered.

**Goal**

Get a solid multi tenant NestJS API with RLS, auth context, and basic models for tenants, orgs, users and children. Everything else builds on this.

**Key components**

- Tenant and org models.
- User model with roles:
  - Tenant level roles: ADMIN, COORDINATOR, TEACHER, STAFF, PARENT.
  - Org level roles: ORG_ADMIN, SAFEGUARDING_LEAD and others as needed.
- PathWayRequestContext:
  - Carries tenantId, orgId, userId and roles.
- Guards:
  - PathwayAuthGuard – ensures the request has a valid JWT and tenant context.
  - Org guard – ensures access to a specific org where required.
- RLS:
  - Enabled per tenant schema in Postgres.
  - Policies ensuring each tenant only sees their own data.
  - Hard requirement for all core tables.

**Outcomes**

- API can safely serve multiple tenants.
- Every request has a clear tenant and org context.
- RLS cannot be bypassed from the app code.

---

## 3. Epic 2 – Children, parents and attendance core

**Status**: Delivered.

**Goal**

Implement the domain core for children, parents and attendance, wired to RLS and PathWay auth.

**Children**

- Models for Child, ChildGroup, relationships to org and tenant.
- Basic attributes:
  - Name, preferred name.
  - Allergies and disabilities (additional needs).
  - Photo consent flag.
- CRUD endpoints with RBAC:
  - Staff roles manage children.
  - Parents only see their own linked children.

**Parents / guardians**

- Represented as User rows with hasFamilyAccess flag.
- Linked to children via a junction table or relation.
- Initial usage focused on read access and safeguarding.

**Attendance**

- Session linked attendance records.
- Simple statuses:
  - present, absent, late, unknown.
- APIs to mark attendance for a session and child.

**Outcomes**

- Data model and core APIs for children, parents and attendance exist and are tenant safe.
- Mobile and admin UI can build on this foundation.

---

## Epic 3 – AV30 activity tracking and usage counters

**Status**: Delivered.

**Goal**

Track staff activity that counts towards AV30 and compute daily usage counters per org.

### 3.1 AV30 activity model and service

- StaffActivity table:
  - tenantId, orgId, staffUserId, activityType, occurredAt, createdAt.
  - Indexes on tenantId, orgId and staffUserId + occurredAt.
  - RLS policies aligned to other tenant tables.
- AV30ActivityService:
  - recordActivity(params) to record an event.
  - recordActivityForCurrentUser(activityType, occurredAt) convenience method using PathWayRequestContext.
  - Skips parent users.
  - Never throws in the request path – logs failures.

### 3.2 Activity emitters

- Attendance:
  - On create and update, records ATTENDANCE_RECORDED for staff marking attendance.
- Assignments:
  - On creation, records ASSIGNMENT_PUBLISHED for assigned staff.
  - On status change to CONFIRMED, records ASSIGNMENT_ACCEPTED.
  - On status change to DECLINED, records ASSIGNMENT_DECLINED.
- Sessions:
  - No direct changes; assignments drive most staff activity.

### 3.3 AV30 compute job (workers)

- Workers app has Av30ComputeService:
  - Reads StaffActivity in the last 30 days per org.
  - Counts distinct staffUserId.
  - Upserts UsageCounters with av30 and calculatedAt.
- CLI entry:
  - `AV30_TENANT_IDS=tenantA,tenantB pnpm --filter @pathway/workers run compute:av30`.
- Tests for:
  - Multi tenant isolation.
  - 30 day window correctness.
  - Idempotent updates.

**Outcomes**

- AV30 is computed correctly per org.
- Workers can be scheduled nightly to update AV30.

---

## Epic 4 – Billing, entitlements and AV30 enforcement

**Status**: Delivered.

**Goal**

Introduce subscription and entitlement models, integrate with billing provider, and enforce AV30 caps on core operations.

### 4.1 Billing models and entitlements resolver

- Models:
  - Subscription – provider, planCode, status, periodStart, periodEnd, cancelAtPeriodEnd.
  - OrgEntitlementSnapshot – caps and flags for AV30, storage, SMS, seats, sites.
  - UsageCounters – av30 and other usage metrics over time.
  - BillingEvent – record incoming billing events for audit and idempotency.
- EntitlementsService:
  - resolve(orgId) returns ResolvedEntitlements with:
    - Caps: av30Cap, storageGbCap, smsMessagesCap, leaderSeatsIncluded, maxSites.
    - Usage: currentAv30, storageGbUsage, smsMonthUsage, usageCalculatedAt.
    - Subscription info and flags.
  - Falls back to safe defaults when data is missing.

### 4.2 Billing webhook integration

- `POST /billing/webhook`:
  - No auth, uses provider signature header.
  - Parses events into internal kinds:
    - subscription.created, subscription.updated, subscription.canceled, invoice.paid, unknown.
  - Idempotency:
    - Checks BillingEvent for existing provider + eventId.
    - Duplicate events short circuit as ignored_duplicate.
  - Writes:
    - Subscription upserts from provider data.
    - OrgEntitlementSnapshot when caps are provided.
    - BillingEvent entry for all events.
  - Logging via LoggingService with no PII or payloads.

### 4.3 AV30 enforcement service

- EntitlementsEnforcementService:
  - checkAv30ForOrg(orgId) returns status:
    - OK, SOFT_CAP, GRACE, HARD_CAP.
    - Includes currentAv30, av30Cap, graceUntil and messageCode.
  - assertWithinHardCap throws Av30HardCapExceededError on HARD_CAP.
- Enforcement wiring:
  - Announcements:
    - Create and publish on update are blocked on HARD_CAP.
  - Sessions:
    - Create blocked on HARD_CAP.
  - Assignments:
    - Create blocked on HARD_CAP.
  - Soft and grace states allowed with TODO for visible warnings.

**Outcomes**

- Billing state and entitlements are centralised and testable.
- AV30 hard cap prevents overuse beyond paid capacity.
- Webhook flow is idempotent and safe.

---

## Epic 5 – Admin UI shell, core lists and forms

**Status**: In progress (admin shell and most lists delivered; more polish and a11y still open).

**Goal**

Deliver a calm, professional admin UI that matches the PathWay mobile design language, supports day to day operations and surfaces billing usage clearly.

### 5.1 Design system and admin shell

**Delivered**

- Shared `@pathway/ui` package with:
  - Theme tokens exposed as Tailwind variables (colors, typography, spacing, radius, elevation).
  - shadcn style primitives:
    - Button, Badge, Card, DataTable, Input, Textarea, Label, Select.
    - Layout primitives: SidebarNav, TopBar, PageShell.
- Admin shell:
  - Fixed sidebar with PathWay logo and navigation.
  - Top bar with page title and future org switcher/user menu slots.
  - Main content constrained to a max width with breathing space.
- Branding:
  - Logo sized correctly in sidebar.
  - Favicon set from PathWay logo.
  - Dashboard copy and cards aligned to branding guidelines.

**Open items**

- Responsive and collapsible sidebar for tablet and mobile breakpoints.
- Global a11y pass:
  - Keyboard focus and skip links.
  - Contrast confirmation.
  - Consistent error and empty states.

### 5.2 Core lists and detail views

**Delivered**

- People:
  - `/people` list with search and role filter.
  - `/people/[id]` detail page with roles and metadata.
- Children:
  - `/children` list using DataTable with flags (allergies, additional needs, photo consent), status and age group filter.
  - `/children/[id]` detail pulling from real `/children/:id` API.
- Parents and guardians:
  - Real `/parents` and `/parents/:id` API in backend.
  - `/parents` DataTable with search and children count.
  - `/parents/[id]` detail page linked to child pages.
- Sessions and attendance:
  - `/sessions` list backed by real API plus tab for rota view.
  - `/sessions/[id]` detail with summary, attendance and staff & rota card.
  - `/attendance` and `/attendance/[sessionId]` pages showing attendance summaries and per child statuses.
- Lessons:
  - `/lessons` list backed by lessons API.
  - `/lessons/[lessonId]` detail showing description and resources.
- Notices and announcements:
  - `/notices` list wired to `/announcements`.
  - `/notices/[announcementId]` detail with message, schedule and audience data.
- Safeguarding overview:
  - `/safeguarding` metadata only page with:
    - Open concerns table (safe child labels, status, category, reporter label).
    - Positive notes counts only (no text).
- Billing overview:
  - `/billing` page reading from entitlements API and showing:
    - Plan and subscription status.
    - AV30 usage.
    - Storage/SMS/seats/sites caps.
- Reports:
  - `/reports` high level snapshot with:
    - Children and parents counts.
    - Open concerns and positive notes counts.
    - AV30 usage snapshot.
    - Links into safeguarding, attendance, billing.

**Open items**

- Better pagination, sorting and filters for larger datasets (server side when APIs support it).
- Deeper lesson and scheduling insights once APIs are richer.
- More consistent empty state illustrations or icons.

### 5.3 Safeguarding UI – metadata only

**Delivered**

- `/safeguarding` is explicitly metadata only:
  - Guardrail comments in code to prevent adding free text or DSAR level data.
- Open concerns card:
  - Uses `fetchOpenConcerns`.
  - Shows created date, safe child label, status badge, category, generic staff label.
  - No links into concern detail from overview.
- Positive notes summary:
  - Uses `fetchNotesSummary`.
  - Shows only counts and high level labels.
  - No note text surfaced.
- Clear comments in code that any change exposing more detail requires a safeguarding review.

**Open items**

- A deeper safeguarding console (for safeguarding leads only) is future work and out of scope for this epic.

### 5.4 Billing and usage UI

**Delivered**

- `/billing` integrates with entitlements resolver:
  - Plan and subscription card (status, plan name, period, renew/cancel notes).
  - AV30 usage card with simple usage bar and text label.
  - Limits card summarising storage/SMS/seats/sites.
- Guardrails:
  - Comments in client and page components that no payment method details, card digits or provider payloads are ever surfaced.
  - All billing data shown is metadata and usage only.

**Open items**

- Display invoices or payment history in a provider safe way, if required.
- Visual indicators for AV30 soft and grace states once exposed from enforcement service.

### 5.5 Admin forms – sessions, lessons, notices

**Delivered**

- Sessions:
  - `POST /sessions` and `PATCH /sessions/:id` wiring via client helpers.
  - `/sessions/new` and `/sessions/[id]/edit` forms for title, start/end, group/class text.
  - Validation for title and sensible time range.
- Lessons:
  - `POST /lessons` and `PATCH /lessons/:id` helpers.
  - `/lessons/new` and `/lessons/[lessonId]/edit` forms.
  - Fields for title, weekOf, group text and description.
  - Resource labels list (label only, primary mapped to fileKey as placeholder).
- Notices and announcements:
  - `POST /announcements` and `PATCH /announcements/:id` helpers.
  - `/notices/new` and `/notices/[announcementId]/edit` forms.
  - Fields for title, body, audience (all/parents/staff), delivery mode (draft/now/schedule) and channels (email/in app).
  - Validation for required fields, future schedule and at least one channel.
  - Custom styled radios and checkboxes aligned to PathWay primary color.

**Open items**

- Replace text based group inputs with real group pickers once APIs are available.
- Rich text editor for notice body if needed.
- Stronger confirmation flows for scheduled notices.

### 5.6 People and rota views

**Delivered**

- Assignments and rota API client:
  - Mapping helpers for assignments and rota days.
  - `fetchAssignmentsForOrg` supports date window and optional sessionId filter.
- Sessions rota tab:
  - Week based rota view within `/sessions` with tabs “Sessions” and “Rota”.
  - Week navigation (Monday to Sunday).
  - Assignments grouped by day and sorted by start time.
- Session staff & rota card:
  - Shows staff name, role and status badges.
  - Inline status update select.
  - Remove assignment action.
  - Add staff form using staff ID (placeholder for future autocomplete).

**Open items**

- Replace raw staff ID input with searchable dropdown using a staff lookup endpoint.
- Additional rota views for individual staff members.

### 5.7 A11y and polish sweep (remaining)

**Status**: Not started.

**Goal**

Bring the admin UI up to a consistent baseline of accessibility and polish.

**Key tasks**

1. Keyboard navigation:
   - Ensure all interactive elements are focusable.
   - Add skip to main content link.
2. Focus and states:
   - Confirm focus rings are visible on all buttons, links and controls.
   - Normalize loading, empty and error states across pages.
3. Contrast:
   - Check against WCAG AA for text and key controls.
   - Adjust Tailwind variables where needed.
4. Global toasts and modals:
   - Add a lightweight pattern for success/error toasts and confirmation modals used across forms.

**Acceptance**

- Admin can be used end to end with keyboard only.
- No obvious contrast violations for core UI.
- Forms and list actions share a consistent pattern for loading, success and error feedback.

---

## Epic 6 – Mobile app (PathWay leader app)

**Status**: Not started – to be tackled after Epic 8 (Buy now) unless priorities change.

**Goal**

Deliver a React Native app for staff and volunteers to:

- See today’s sessions and rota.
- Mark attendance quickly (with offline first behaviour).
- Capture safeguarding notes and concerns with appropriate RBAC.
- View key notices and updates.

**High level sub-epics**

- 6.1 Mobile shell and navigation.
- 6.2 Sessions and attendance flows.
- 6.3 Safeguarding capture.
- 6.4 Notices and inbox.
- 6.5 Offline sync and error handling.
- 6.6 A11y and polish.

(Detailed mobile plan omitted here – focus on finishing backend, admin UI and Buy now first.)

---

## Epic 7 – Observability, DSAR and retention

**Status**: Delivered.

**Goal**

Give PathWay strong operational observability, DSAR export for children and a first pass at data retention.

### 7.1 Structured logging

- LoggingService and StructuredLogger:
  - Redacts sensitive keys.
  - Attaches tenantId, orgId and userId where available.
- Adoption:
  - Orgs and Billing modules using structured logging.
  - Safeguarding modules log minimal metadata only.
- No raw DTOs or PII logged in normal paths.

### 7.2 DSAR API for children

- `/internal/dsar/child/:childId`:
  - Guarded by PathwayAuthGuard and SafeguardingGuard.
  - Restricted to tenant ADMIN and safeguarding roles.
- Response aggregates:
  - Child profile.
  - Linked parents and guardians.
  - Attendance.
  - Child notes and concerns.
  - Sessions referenced by attendance.
- Tenant safe queries and RLS enforced.
- DSAR payload never logged.

### 7.3 Retention skeleton

- OrgRetentionPolicy model:
  - Per org retention choices (years) for key tables.
- RetentionConfigService:
  - Default retention rules.
- Workers retention job:
  - Guarded by RETENTION_ENABLED.
  - Deletes old attendance, staffActivity and auditEvent according to policy.
  - Leaves sensitive tables with TODOs for future careful handling.

**Outcomes**

- PathWay has a DSAR export for children.
- Logging is structured, redacted and tenant aware.
- Retention has a first pass implementation ready to be tuned.

---

## Epic 8 – Plans, pricing and “Buy now” self-serve flow

**Goal and impact**

Let small and mid sized orgs self serve onto PathWay on Starter or Growth plans while keeping Enterprise on “Contact us”. The flow should:

- Present simple plans with clear AV30 caps and optional add ons.
- Create a deterministic entitlement snapshot for the org that matches the selected plan and add ons.
- Hand off to the existing billing provider and webhook pipeline.
- Land the new org in a ready to onboard state with correct caps and billing state.

This epic assumes Epics 3 and 4 are in place (AV30 tracking, entitlements, billing webhooks) and focuses on productising plans and building the outward facing flow.

**Status**

Not started (backend foundation exists from Epics 3 and 4 but the catalogue and public flow are not built).

**Dependencies**

- Epic 3 – AV30 activity and UsageCounters.
- Epic 4 – Billing models, Subscription, EntitlementsService, billing webhook and idempotency.
- Epic 5 – Admin UI shell and billing usage page.

**Out of scope**

- Complex mid term plan changes and proration.
- In app “change plan” for existing orgs.
- Direct sales or invoice based enterprise deals.

---

### 8.1 Plans and pricing catalogue

Backend representation of plans, add ons and AV30 caps that the rest of the system can rely on.

**Key tasks**

1. Define a small plan catalogue in code (Starter, Growth, Enterprise/Trust contact sales) with:
   - Plan code and tier.
   - Included AV30 cap, included sites, included leader seats.
   - Optional flags for storage/SMS/export add ons.
2. Wire the catalogue into EntitlementsService so a plan code can be resolved into caps and flags even before a snapshot exists.
3. Add a light seed script or fixture so tests and dev envs have a stable set of plans.
4. Add unit tests that ensure each plan’s caps match the commercial sheet and that invalid plan codes fail loudly.
5. Document the catalogue for product and operations in this plan so later changes are intentional.

**Acceptance**

- Given a plan code, EntitlementsService returns the expected caps and tier.
- Starter and Growth can be used anywhere a plan code is needed without hard coding numbers in controllers.

---

### 8.2 Checkout API and pricing estimates

Public safe endpoints to expose the catalogue to the “Buy now” page and create a checkout session with the billing provider.

**Key tasks**

1. Add `GET /billing/catalog` that returns the plans and add ons that can be purchased self serve (no internal flags or provider IDs).
2. Add `POST /billing/estimate` that accepts a draft selection `{ planCode, billingPeriod, av30AddOnBlocks, extraAddOns[] }` and returns:
   - Human readable line items.
   - Monthly and yearly totals.
   - A short “what you get” summary.
3. Add `POST /billing/checkout` that:
   - Validates the selection with the catalogue.
   - Creates a PendingOrder (or similar) tied to the prospective org and admin email.
   - Creates a checkout session with the provider and returns the redirect URL.
   - Records an internal idempotency key so repeated posts do not create duplicate sessions.
4. Ensure all endpoints use the existing LoggingService and never log card details or provider payloads.
5. Add focused unit tests around the estimate maths and idempotency, plus one e2e path that runs catalogue → estimate → checkout using the fake provider.

**Acceptance**

- Frontend can fetch catalog and estimates without knowledge of the provider.
- Posting the same checkout payload twice returns the same logical PendingOrder and is idempotent.
- No sensitive payment data appears in logs or DSAR exports.

---

### 8.3 Public “Buy now” page

A small, focused Next.js route that lets a new org pick a plan, choose AV30 capacity and add ons, and go to checkout.

**Key tasks**

1. Add a public route, for example `/buy`, in the marketing or public app (or admin with a public layout) that:
   - Shows Starter and Growth cards with price per month, price per year, AV30 cap and key features.
   - Treats Enterprise/Trust as a “Contact us” card that links to a contact form instead of checkout.
2. Implement a Monthly / Yearly toggle that:
   - Recalculates prices and highlights the savings where appropriate.
   - Keeps the underlying plan code and caps unchanged.
3. Add AV30 capacity controls:
   - Show the included AV30 cap per plan.
   - Offer additional AV30 in fixed blocks such as +25 with a simple plus/minus control.
   - Reflect the extra cost in the price summary.
4. Integrate with the new checkout API:
   - On “Continue to payment”, call `POST /billing/checkout`.
   - Handle loading, validation errors and a clear error state if checkout fails.
   - Redirect to the provider checkout URL on success.
5. Add success and failure landing routes:
   - `/buy/success` that explains what happens next and where the admin will log in.
   - `/buy/error` for failed or cancelled checkouts with a support contact.

**Acceptance**

- A new visitor can pick Starter or Growth, tweak AV30, see the total and be redirected to provider checkout.
- Enterprise plan does not try to self serve and instead routes to contact.
- The flow uses the same Tailwind/shadcn design language as the admin but feels clearly public.

---

### 8.4 Entitlements and org bootstrap hardening

Ensure that completed checkouts always result in a correct Subscription, OrgEntitlementSnapshot and onboarding ready org.

**Key tasks**

1. Extend the billing webhook controller so the events produced by self serve checkout:
   - Attach to the correct PendingOrder or org.
   - Upsert Subscription with the chosen plan and billing period.
   - Write an OrgEntitlementSnapshot that matches the catalogue selection.
2. Add defensive handling for:
   - Duplicate provider events (idempotency).
   - Failed payments or expired checkouts (mark PendingOrder as abandoned and do not create an active Subscription).
3. Add smoke tests that simulate:
   - New Starter monthly org.
   - New Growth yearly org with extra AV30 blocks.
4. Ensure DSAR and logging rules are respected for all new records – no provider payloads in AuditEvent.

**Acceptance**

- After a successful checkout, EntitlementsService.resolve for the new org matches the initial selection.
- Failed or abandoned checkouts do not create active subscriptions.

---

### 8.5 Admin and support views for plans and billing

Give internal staff and org admins enough visibility to support customers without exposing payment details.

**Key tasks**

1. Extend `/billing` in the admin UI to show:
   - Current plan and billing period.
   - AV30 usage vs cap with a clear ratio.
   - Any storage/SMS/sites caps that apply.
2. Add a simple “Plan details” card that reflects the catalogue facts (tier and included caps) without needing provider data.
3. Add a support only view (even a basic table) that lists:
   - Pending orders with status.
   - Recent subscriptions created by “Buy now”.
4. Add an export or copy friendly summary of an org’s plan and caps for support.

**Acceptance**

- Support can answer “what plan is this org on and what are their caps” without touching the provider portal.
- Admins have a clean, read only view of their plan and AV30 usage.

---

### 8.6 Experiments, tracking and launch

Light weight instrumentation and a basic launch plan for the self serve flow.

**Key tasks**

1. Add basic analytics events around the Buy now journey:
   - Plan viewed, plan selected, AV30 adjusted, checkout started, checkout completed, checkout failed.
2. Add one feature flag or environment switch so the Buy now page can be soft launched (internal only, limited tenants, then public).
3. Document the initial pricing assumptions and how to change them safely (catalogue changes, communication and migration paths).
4. Capture a short “how to” runbook for support covering:
   - How to verify a new org after checkout.
   - How to handle failed payments or duplicate signups.

**Acceptance**

- You can turn Buy now on or off per environment without code changes.
- You can see basic funnel metrics for the self serve journey.

---

### 8.7 Billing and Payments (Stripe + GoCardless)

> Update: Standardise on Stripe Billing for card-based subscriptions and add-ons, with GoCardless Direct Debit reserved for Suite (multi-site) customers that require UK Direct Debit. This matches the existing billing brief (Stripe for plans and add-ons, GoCardless for Suite DD) and keeps entitlement updates webhook-driven. [oai_citation:0‡PathWay_Billing_Entitlements_Implementation_Brief.docx](file-service://file-NafcoCY33u7eWm53Y4TNRG) [oai_citation:1‡PathWay_Billing_Entitlements_Implementation_Brief.docx](file-service://file-NafcoCY33u7eWm53Y4TNRG)

## Goals

- Support monthly and annual subscriptions for Starter, Growth, and Pro via Stripe.
- Support Suite plans via Direct Debit using GoCardless (primary), with optional Stripe fallback for card.
- Support add-on packs (AV30 blocks, SMS bundles, storage packs) and deterministic entitlement snapshots.
- Ensure all entitlement changes are driven by provider webhooks with strict idempotency and auditability. [oai_citation:2‡PathWay_Billing_Entitlements_Implementation_Brief.docx](file-service://file-NafcoCY33u7eWm53Y4TNRG)

## Provider strategy

- Default provider: Stripe (all non-Suite orgs).
- Suite orgs:
  - Payment method choice: Direct Debit (GoCardless) by default.
  - Optional: allow card via Stripe if a Suite customer needs it (feature-flag).
- A single Org can have multiple historical subscriptions, but only one active “billing source of truth” at a time.

## Data model adjustments (Prisma)

Current schema already has:

- `BillingProvider { STRIPE, GOCARDLESS }`
- `Subscription` with `provider`, `providerSubId`, `status`, `periodStart`, `periodEnd`
- `Org` includes `stripeCustomerId`
- `BillingEvent` for storing provider payloads and an audit trail [oai_citation:3‡schema.prisma](file-service://file-HAy8A1eVbthkpQxTWTu9o5) [oai_citation:4‡schema.prisma](file-service://file-HAy8A1eVbthkpQxTWTu9o5)

### Recommended additions to fit Stripe + GoCardless cleanly

1. Extend `Org` with GoCardless identifiers:

- `goCardlessCustomerId String? @unique`
- `goCardlessMandateId String? @unique`
- `goCardlessSubscriptionId String? @unique` (if you want a direct pointer to the active GC sub)
  Rationale: Suite DD onboarding is mandate-driven and you will routinely need to fetch and reconcile state from GoCardless. [oai_citation:5‡PathWay_Billing_Entitlements_Implementation_Brief.docx](file-service://file-NafcoCY33u7eWm53Y4TNRG)

2. Improve `BillingEvent` idempotency:

- Add `externalId String` (provider event id) and `@@unique([provider, externalId])`
- Add `processedAt DateTime?`
  Rationale: prevents double-processing during webhook retries and makes reconciliation simpler.

3. Snapshot provenance and reconciliation:

- Ensure `OrgEntitlementSnapshot.source` uses stable values like:
  - `subscription(stripe:<subId>)`
  - `subscription(gocardless:<subId>)`
  - `manual_override`
    Rationale: makes it obvious which provider state last wrote entitlements. [oai_citation:6‡schema.prisma](file-service://file-HAy8A1eVbthkpQxTWTu9o5)

## Products, prices, and SKUs

Define one internal catalogue and map it to provider-specific product/price IDs:

- Base plans:
  - Starter, Growth, Pro (monthly + annual)
- Suite plans:
  - Suite Starter, Suite Growth, Suite Pro (monthly for GoCardless; annual optional, see improvements below)
  - Extra Site as a separate recurring price
- Add-ons:
  - AV30 packs (+25, +100 for single-site; +100/+250/+500 for Suite)
  - SMS bundle (1k)
  - Storage packs (or metered later)
    This is aligned with the existing billing implementation brief. [oai_citation:7‡PathWay_Billing_Entitlements_Implementation_Brief.docx](file-service://file-NafcoCY33u7eWm53Y4TNRG)

## Checkout and subscription lifecycle

### Stripe flow (non-Suite, and optionally Suite-card)

- Use Stripe Checkout for initial purchase and upgrades (Buy Now page).
- Store `stripeCustomerId` on Org and create or update `Subscription` records on webhook confirmation.
- Entitlements update on:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed` (flag at-risk; do not auto-cancel)
    All six events are processed via the **Stripe snapshot webhook** only, verified with `STRIPE_WEBHOOK_SECRET_SNAPSHOT`.
    `STRIPE_PUBLISHABLE_KEY` is client-side only (admin/mobile) to initialise Stripe; do not log it server-side.
    This is already called out in the brief as the invalidation triggers for the entitlements cache. [oai_citation:8‡PathWay_Billing_Entitlements_Implementation_Brief.docx](file-service://file-NafcoCY33u7eWm53Y4TNRG)

### GoCardless flow (Suite Direct Debit)

- Step 1: create GoCardless customer and redirect flow to collect mandate.
- Step 2: on mandate activation, create GoCardless subscription (Suite plan + extras).
- Step 3: update internal `Subscription` row for provider = GOCARDLESS and persist mandate/sub ids.
- Entitlements update on GoCardless webhook events:
  - mandate activated
  - subscription created/updated/cancelled
  - payment confirmed/failed
    The brief explicitly states “GoCardless Direct Debit for Suites; sync via webhooks.” [oai_citation:9‡PathWay_Billing_Entitlements_Implementation_Brief.docx](file-service://file-NafcoCY33u7eWm53Y4TNRG)

## Webhook handling (both providers)

- Stripe: **single SNAPSHOT webhook endpoint** (currently `POST /billing/webhook` in API) handling the six billing events above, verified with `STRIPE_WEBHOOK_SECRET_SNAPSHOT`. The Thin webhook does not participate in billing and may be removed later.
- GoCardless: placeholder endpoint may exist for DD, but is not yet wired for billing in this epic.
- Hard requirements:
  - Verify signature (provider-specific).
  - Persist raw event payload as `BillingEvent` first.
  - Enforce idempotency using `(provider, externalId)` uniqueness.
  - Process in a transaction:
    - Upsert `Subscription` state
    - Write `OrgEntitlementSnapshot` based on internal plan preview rules
- Always recompute entitlements from internal rules, never from arbitrary provider metadata.

## Entitlements, usage, and enforcement linkage

- Keep the entitlement service and enforcement rules unchanged, but ensure it invalidates and recomputes on both Stripe and GoCardless events. [oai_citation:10‡PathWay_Billing_Entitlements_Implementation_Brief.docx](file-service://file-NafcoCY33u7eWm53Y4TNRG)
- Continue using AV30 calculation and usage counters as described. [oai_citation:11‡PathWay_Billing_Entitlements_Implementation_Brief.docx](file-service://file-NafcoCY33u7eWm53Y4TNRG)
- Ensure “hard cap” enforcement blocks write actions (publish rota, announcements) but still allows viewing, as in the brief. [oai_citation:12‡PathWay_Billing_Entitlements_Implementation_Brief.docx](file-service://file-NafcoCY33u7eWm53Y4TNRG)

## Improvements to fit PathWay perfectly (recommended adjustments)

1. One “billing state machine” layer

- Implement an internal canonical status model:
  - `ACTIVE`, `PAST_DUE`, `CANCELED`, `INCOMPLETE`
- Map Stripe and GoCardless statuses into this model.
  Benefit: the rest of the platform depends on one interpretation of “paid and active”.

2. Reconciliation job

- Nightly (or hourly) job that:
  - pulls the current subscription status from Stripe / GoCardless for orgs with active subs
  - heals any drift (missed webhook, out-of-order events)
    Benefit: billing becomes self-healing and reduces support load.

3. GoCardless annual billing decision

- Recommendation: ship Suite Direct Debit as monthly first.
- Add annual DD only if you confirm GoCardless supports the commercial requirement cleanly (some customers will accept monthly DD even if you position “annual discount” as card/invoice).
  Benefit: reduces edge-case complexity early while still serving the UK school preference for DD.

4. Provider abstraction boundaries

- Keep `BillingProvider` adapters strict:
  - `createCheckoutSession`, `createMandateFlow`, `createOrUpdateSubscription`, `cancelSubscription`, `getSubscription`
- Everything else (entitlements, caps, AV30, warnings) stays provider-agnostic.

## Testing and observability

- Integration tests:
  - Stripe webhook sequence updates entitlements
  - GoCardless mandate + subscription + payment events update entitlements
  - Idempotency: replay the same webhook twice and assert no double snapshots/events
- Telemetry:
  - counters for webhook processed, webhook duplicates rejected
  - gauges for entitlement caps and AV30 usage (already in the brief) [oai_citation:13‡PathWay_Billing_Entitlements_Implementation_Brief.docx](file-service://file-NafcoCY33u7eWm53Y4TNRG)

## Acceptance criteria

- A non-Suite org can buy monthly or annual and immediately receives correct entitlements after `invoice.paid`.
- A Suite org can complete DD mandate, become ACTIVE after first successful payment event, and receives correct pooled entitlements.
- Replaying webhooks does not create duplicate `BillingEvent` rows or duplicate entitlement snapshots.
- Entitlement enforcement gates core actions when hard caps are exceeded, as defined. [oai_citation:14‡PathWay_Billing_Entitlements_Implementation_Brief.docx](file-service://file-NafcoCY33u7eWm53Y4TNRG)

## Recommended Next Steps

1. Keep Epic 4 and Epic 7 green – backend safety and observability are foundational.
2. Finish Epic 5 (Admin UI) to a level where day to day operations are comfortable for early customers.
3. Tackle Epic 8 (plans, pricing and Buy now) before starting Epic 6 (mobile app) so billing and entitlements are commercially ready.
4. Once admin and Buy now are stable, move to Epic 6 for the PathWay leader mobile app.
