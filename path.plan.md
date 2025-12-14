# PathWay – Epics, Status & Roadmap (Backend + Admin UI)

This document gives Cursor high-level context on:

- What has already been built (backend).
- What remains to be built (Admin UI + Mobile).
- Non-negotiable rules (multi-tenancy, safeguarding, AV30 billing).
- How to prioritise future work.

It should be read together with:

- `pathway-rules.mdc` (global platform rules)
- `pathway-admin-ui-rules.mdc` (admin UI rules)
- `pathway-admin-ui-spec.md` (UI/UX spec)
- The **Design Branding Guidlines** folder (design reference ONLY, never imported into production code).

---

## Epic 1 – Multi-tenancy, Auth & RLS Foundation

**Status:** ✅ Complete (with ongoing refinements allowed)

### Goal

Establish secure, tenant-isolated access across the API using Auth0-style claims, Nest guards, and Postgres RLS. This underpins safeguarding and billing correctness.

### What’s Implemented

- `@pathway/auth` package with:
  - `PathwayAuthGuard`
  - `PathwayRequestContext`
  - `@CurrentUser` / `@CurrentOrg` / `@CurrentTenant` decorators
- Request context used across API modules instead of raw `tenantId` query/body params.
- Postgres RLS policies enabled for multi-tenant tables (Tenant, Org, Child, Group, Session, Attendance, Notes, Concerns, StaffActivity, UsageCounters, etc.).
- E2E tests run under a low-privilege test role with RLS ON.
- Tenant-scoped list/read methods:
  - Users, Groups, Orgs, Sessions, Attendance, Assignments, Lessons, Announcements, Notes, Concerns all restricted to current tenant/org.
- Test DB setup hardened (SUPER_TEST_DATABASE for reset, RLS-aware seeding helpers).

### Remaining / Ongoing

- Keep new tables RLS-safe:
  - Any new multi-tenant table must have RLS policies + tenantId/orgId.
- Ensure new services use `PathwayRequestContext` instead of accepting arbitrary `tenantId` values.

---

## Epic 2 – Safeguarding & Pastoral Flows (Concerns & Notes)

**Status:** ✅ Complete (with minor TODOs)

### Goal

Treat safeguarding entities (Concern, ChildNote) as highly sensitive: strict RBAC, audit logging, and parent visibility rules aligned with safeguarding good practice.

### What’s Implemented

- `apps/api/src/common/safeguarding/*`:
  - `SafeguardingGuard`
  - `AllowedSafeguardingRoles` decorator
  - RBAC matrix (admins + safeguarding leads only for concerns; teachers/staff limited for notes).
- Controllers use `PathwayAuthGuard` + `SafeguardingGuard` + `@CurrentUser` / `@CurrentTenant`:
  - No manual author/tenant IDs accepted from clients.
- Concerns:
  - Soft-delete via `deletedAt`.
  - Fully tenant-scoped.
- Child notes:
  - `visibleToParents`, `approvedBy*` fields to support future parent visibility rules.
- `AuditEvent` model + `AuditService`:
  - Records CREATED/VIEWED/UPDATED/DELETED for safeguarding operations without logging full note text.
- Unit + e2e tests:
  - Enforce RBAC + tenant isolation.
  - Assert audit events are written.

### Remaining / TODO

- Finalise parent visibility rules for positive notes:
  - Implement and enforce `visibleToParents` + `approvedBy*` across API and UI.
- Clarify long-term retention for Concerns/ChildNotes (see Epic 7.3).

---

## Epic 3 – Attendance, Scheduling & AV30 Usage Tracking

**Status:** ✅ Complete

### Goal

Tie attendance and scheduling flows into AV30 usage metrics, enabling accurate per-org billing and reporting.

### What’s Implemented

- `packages/types/src/av30.ts`:
  - `Av30ActivityType` enum and types for recording qualifying activity.
- `StaffActivity` (Prisma model + RLS):
  - orgId, tenantId, staffUserId, activityType, occurredAt, createdAt.
  - Indexed for time-range + org/staff queries.
- `Av30ActivityModule` + `Av30ActivityService`:
  - `recordActivity` and `recordActivityForCurrentUser` (skips parents).
- API emitting AV30 events:
  - Attendance create/update → `ATTENDANCE_RECORDED`.
  - Assignments:
    - create → `ASSIGNMENT_PUBLISHED`.
    - status changes → `ASSIGNMENT_ACCEPTED` / `ASSIGNMENT_DECLINED`.
- Workers app:
  - `Av30ComputeService` + `Av30ComputeJob`:
    - Computes unique staff users over last 30 days per org.
    - Upserts `UsageCounters.av30` + `calculatedAt`.
  - CLI entry: `AV30_TENANT_IDS=... pnpm --filter @pathway/workers run compute:av30`.
- RLS-aware tests:
  - Multi-org StaffActivity seeding.
  - AV30 computed correctly and ignores >30d activity.

### Remaining / TODO

- Optionally expand activity types if new flows become billable.

---

## Epic 4 – Billing, Entitlements & Enforcement

**Status:** ✅ Complete (with some UX polish left)

### Goal

Use AV30 and entitlements to enforce plan limits, surface friendly warnings, and integrate with billing provider webhooks.

### What’s Implemented

- `EntitlementsService`:
  - Resolves AV30 caps, storage, SMS, seats, sites, and current usage per org from:
    - `Subscription`
    - `OrgEntitlementSnapshot`
    - `UsageCounters`
  - Returns `ResolvedEntitlements` DTO with safe defaults.
- Billing webhooks:
  - `POST /billing/webhook` with `BillingWebhookProvider` (fake adapter for now).
  - Signature check placeholder, internal event kinds (`subscription.updated`, `invoice.paid`, etc.).
  - Updates `Subscription`, `OrgEntitlementSnapshot`, `BillingEvent`.
  - Idempotent via provider+eventId check.
  - PII-safe logging only (provider, eventId, type, orgId).
- AV30 Enforcement:
  - `EntitlementsEnforcementService`:
    - `checkAv30ForOrg` → `Av30EnforcementResult` with status: `OK | SOFT_CAP | GRACE | HARD_CAP`.
    - `assertWithinHardCap` → throws `Av30HardCapExceededError` on hard cap.
  - Constants:
    - `AV30_SOFT_CAP_RATIO = 1.0`
    - `AV30_GRACE_RATIO = 1.1`
    - `AV30_HARD_CAP_RATIO = 1.2`
    - `AV30_GRACE_DAYS = 14`
- Enforcement wiring:
  - Announcements create (and publish-on-update).
  - Sessions create.
  - Assignments create.
  - All block on HARD_CAP; SOFT/GRACE allowed (warnings TODO).
  - Read-only/list/update (non-publish) remain unaffected.
- Logging:
  - Orgs + billing use structured logging (no DTO/PII logs).

### Remaining / TODO

- Surface SOFT/GRACE states to the frontend with clear UX (toasts/banners/messages).
- Wire AV30/billing status into Admin UI top bar / billing page.

---

## Epic 5 – Admin Web UI Shell & Design System

**Status:** 🟡 Planned (starting now)

> **All Admin UI work must follow:**  
> `pathway-admin-ui-rules.mdc` + `pathway-admin-ui-spec.md`  
> The `Design Branding Guidlines` folder is **reference-only** and must never be imported or copied into production code.

### Goal

Deliver a modern, accessible, Figma-aligned admin UI for PathWay that:

- Provides a standard shell (sidebar, top bar, content).
- Uses a shared design system in `packages/ui`.
- Supports core admin journeys: people, sessions, attendance, safeguarding, billing, reports, settings.

### Epic 5.1 – Design System & Shell (MVP)

**Status:** 🚧 Next to implement

**Goals**

- Establish design tokens + core components in `packages/ui`.
- Implement admin shell (sidebar + top bar + content area) in `apps/admin`.

**Key Tasks**

- `packages/ui`:
  - Define theme tokens: colours, typography, spacing, radius, elevation.
  - Components:
    - `PageShell`
    - `SidebarNav`
    - `TopBar`
    - `Card`
    - `Button`, `Badge`
    - Basic layout primitives as needed (stack, grid).
- `apps/admin/app`:
  - `layout.tsx` using shared shell.
  - Sidebar sections (align with spec): Dashboard, People, Sessions & Attendance, Notices/Lessons, Safeguarding, Billing, Reports, Settings.
  - Initial Dashboard page with static placeholder cards:
    - Today’s sessions
    - Pending attendance
    - Open concerns
    - Recent announcements
- Responsiveness:
  - Fixed sidebar on desktop, collapsible/drawer on smaller screens.
- Auth/tenant wiring:
  - TODO placeholders for Auth0 and `PathwayRequestContext` integration (no full auth in this pass).

### Epic 5.2 – Core Lists & Detail Views

**Status:** 🟡 Planned

**Goals**

Implement core CRUD/list/detail flows for:

- Users/Staff/Volunteers
- Children
- Parents/Guardians
- Sessions & Attendance
- Notices/Announcements

**Key Tasks**

- Shared table component (sortable, filterable, paginated) built in `packages/ui`.
- Pages:
  - `/admin/users`
  - `/admin/children`
  - `/admin/parents`
  - `/admin/sessions`
  - `/admin/attendance`
  - `/admin/notices`
- Each page:
  - List view with filters and search.
  - Detail view (drawer or dedicated page).
  - Loading, empty, and error states.
- Data pulls from API with proper tenant/role scoping.

### Epic 5.3 – Safeguarding Admin UI

**Status:** 🟡 Planned

**Goals**

Expose safeguarding flows to authorised roles only, with clear messaging and safe patterns.

**Key Tasks**

- `/admin/safeguarding`:
  - Tabs for open concerns, closed concerns, child notes.
  - Filters by date, severity, status.
- Concern detail view:
  - Read/append notes; respect RBAC (only safeguarding roles).
  - Show audit awareness: “Access is monitored”.
- Child notes:
  - Staff note creation flows.
  - Parent visibility flags (once finalised).
- No safeguarding content to unauthorised roles; safe “No access” UI.

### Epic 5.4 – Billing & Usage UI

**Status:** 🟡 Planned

**Goals**

Make AV30 usage, plan caps, and billing state visible and actionable for admins.

**Key Tasks**

- `/admin/billing`:
  - Show plan info (tier, AV30 cap, storage, SMS).
  - Show current usage (AV30, storage, SMS) from `UsageCounters` via `EntitlementsService`.
  - Show state: OK / SOFT_CAP / GRACE / HARD_CAP with friendly explanations.
  - Expose “update billing” flows (link to provider portal or internal flows; placeholder if not ready).
- Alerts:
  - Use top bar/banner for hard cap warnings.
  - Use toasts for transient events.

### Epic 5.5 – Reports & Audit

**Status:** 🟡 Planned

**Goals**

Provide basic admin reports and audit views.

**Key Tasks**

- `/admin/reports`:
  - Entry point for operational reports (attendance, staffing, AV30 trends).
- `/admin/audit` (optional initially):
  - Read-only view into `AuditEvent` for super admins.
- Export actions:
  - CSV/Excel export entry points hooked into existing backend exporters (once built).

### Epic 5.6 – Polish, A11y, and UX Refinements

**Status:** 🟡 Planned

**Goals**

Bring admin UI up to an accessible, production-ready standard.

**Key Tasks**

- Ensure AA contrast for all key flows.
- Improve keyboard navigation and focus management.
- Improve empty/loading/error states across pages.
- Implement “No access” patterns for restricted routes.
- Integrate consistent toasts, modals, and confirmations.

---

## Epic 6 – Mobile Staff & Parent App (React Native / Expo)

**Status:** 🟡 Planned (backend-ready, mobile not started)

### Overall Goal

Deliver a single Expo-powered mobile app with **two spaces**:

- **Staff space** – offline-capable rota + attendance + notes for teachers/volunteers.
- **Family space** – simple view for parents/guardians: children, attendance history, notices.

The app must:

- Respect all PathWay backend rules (RLS, safeguarding, AV30, billing).
- Minimise on-device PII; store only what’s needed and encrypt/sandbox where possible.
- Visual design for mobile should closely follow the mockups in the `Design Branding Guidlines` folder (treated as the primary visual spec for mobile, but never imported as code).
- Match the PathWay brand but feel a bit more “friendly” than the admin UI, while still serious enough for school/club contexts.

---

### Epic 6.1 – Mobile App Shell & Navigation

**Status:** 🟡 Planned

**Goal**

Create the core Expo app structure with:

- Auth placeholder hooks
- Navigation for Staff vs Family spaces
- Shared theming aligned with Design Branding Guidelines (as reference only)

**Key Tasks**

- Set up `apps/mobile` with Expo + React Navigation:
  - Root navigator:
    - Auth stack (login/landing – can be mocked initially).
    - Staff tab stack.
    - Family tab stack.
- Theming:
  - Define a mobile theme file (colours, typography, spacing) echoing the PathWay brand.
  - Keep a slightly softer, more “human” tone than admin UI but not childish.
- Basic screens (stubbed):
  - Staff:
    - `StaffTodayScreen`
    - `StaffSessionsScreen`
    - `StaffNotesScreen`
  - Family:
    - `FamilyDashboardScreen`
    - `ChildDetailScreen`
    - `NoticesScreen`
- Add a simple feature flag in code:
  - e.g. `ENABLE_STAFF_SPACE`, `ENABLE_FAMILY_SPACE` to allow shipping in stages.

---

### Epic 6.2 – Staff “Today” View & Attendance (Online)

**Status:** 🟡 Planned

**Goal**

Give staff a **“Today”** experience:

- See their sessions/rotas for the day.
- Record attendance quickly for each session.
- Log basic child notes (non-safeguarding) from mobile.

**Key Tasks**

- Implement `StaffTodayScreen`:
  - Fetch “today’s sessions” for the current staff user from the API.
  - Group by time/room; show status (attendance pending / in-progress / completed).
- Session detail:
  - `StaffSessionDetailScreen`:
    - List children with quick mark (present/absent/late).
    - “Start attendance” / “Complete attendance” actions.
- Notes:
  - Allow adding simple notes (e.g. “forgot PE kit”) that map to ChildNote with `visibleToParents` default rules.
  - Respect safeguarding RBAC: no safeguarding concerns created from the “notes” UI; that remains a separate flow or admin UI responsibility for now.
- Error/empty states:
  - No sessions today → friendly empty state.
  - API errors → retry & fallback messaging.

---

### Epic 6.3 – Offline Attendance & Sync

**Status:** 🟡 Planned

**Goal**

Support **offline-first** attendance for staff:

- Staff can open today’s sessions while online (pre-cache).
- Record attendance offline.
- Sync back when connection returns, without double-counting.

**Key Tasks**

- Storage layer:
  - Introduce offline storage (e.g. SQLite or AsyncStorage + a small abstraction).
  - Define a local model for:
    - Cached sessions + children for the day.
    - Pending attendance changes (queue of mutations with timestamps + client IDs).
- Sync engine:
  - On app launch / regain connectivity:
    - Push pending attendance to the API with idempotent keys.
    - Pull updated attendance status from server.
  - Handle conflict resolution:
    - Prefer server truth, but keep local “unsynced” marker if something fails.
- UI states:
  - Indicate which sessions/attendance records are:
    - synced ✅
    - pending ⌛
    - failed ❌ (with retry CTA)
- Safeguarding & PII:
  - Only cache minimal fields needed for attendance.
  - Respect photo consent: no child photos offline if consent is false.

---

### Epic 6.4 – Family (Parent/Guardian) Space

**Status:** 🟡 Planned

**Goal**

Provide a simple, reassurance-focused space for parents/guardians:

- See their children and basic profile info.
- View attendance history and key notices.
- Receive announcements and updates.

**Key Tasks**

- `FamilyDashboardScreen`:
  - Show children cards (name, year/group, avatar/initials respecting photo consent).
  - Quick links: “Attendance”, “Notices”.
- `ChildDetailScreen`:
  - Basic profile info (limited PII – name, year/group, high-level flags).
  - Attendance history:
    - List sessions with status (present/absent/late).
    - Optional filters by date range.
- `NoticesScreen`:
  - Pull announcements from the API (tenant-scoped, role-scoped).
  - Show read/unread states; allow marking as read.
- Push notifications (later pass):
  - Skeleton for push tokens registration.
  - TODO for integrating with real push provider.

---

### Epic 6.5 – Safeguarding Affordances on Mobile

**Status:** 🟡 Planned

**Goal**

Ensure mobile UX respects safeguarding boundaries:

- Staff can quickly raise safeguarding concerns, but flows are secure.
- Parents never see sensitive safeguarding content.

**Key Tasks**

- Staff safeguarding entry point:
  - Either:
    - A minimal “Report concern” entry that deep-links to admin UI / secure web form, **or**
    - A guarded mobile form that creates Concern records via API (for safeguarding roles only).
  - Very clear copy: access is monitored, safeguarding data is highly confidential.
- Parent side:
  - No access to safeguarding detail content.
  - Positive notes:
    - Only display ChildNotes where `visibleToParents === true` and any approval rules are satisfied.
- Audit:
  - If mobile app can read safeguarding-related data, ensure AuditEvent logic remains consistent via API (no extra logging on device).

---

### Epic 6.6 – Mobile Polish, A11y & Performance

**Status:** 🟡 Planned

**Goal**

Bring the mobile app to a production-ready standard.

**Key Tasks**

- Accessibility:
  - Ensure text sizes, contrast, and touch targets meet mobile guidelines.
  - Screen-reader labels on key components (buttons, tabs, list items).
- Performance:
  - Optimise API calls with pagination / lazy loading where needed.
  - Cache key data (e.g. last-known day’s sessions) for fast startup.
- Error handling:
  - Uniform error toasts/banners.
  - Retry patterns for network failures.
- Theming consistency:
  - Ensure mobile theme remains aligned with PathWay brand and admin UI, but tuned for handheld use.

---

### Dependencies

- Relies on backend epics being stable (Epics 1–4, 7):
  - Auth, RLS, safeguarding, AV30, DSAR, retention.
- Admin UI can progress in parallel, but backend is considered source of truth for:
  - Permissions & RBAC
  - AV30/billing state
  - Safeguarding visibility rules

---

## Epic 7 – Observability, Audit & Data Governance

**Status:** ✅ First phase complete (logging, DSAR, retention skeleton)

### Epic 7.1 – Structured Logging

**Status:** ✅

- `LoggingService` + `StructuredLogger` in `apps/api/src/common/logging/`.
- Redaction (`LOG_REDACTED_VALUE`, `SENSITIVE_KEYS`).
- Logger factories:
  - `createLogger(component, baseMeta?)`
  - `fromRequestContext(component, context?)`
- Orgs + Billing + key modules use structured, PII-safe logs.

### Epic 7.2 – DSAR Export

**Status:** ✅

- `DsarModule`, `DsarController`:
  - `GET /internal/dsar/child/:childId`
- Guards: `PathwayAuthGuard` + `SafeguardingGuard` (tenant ADMIN + safeguarding roles only).
- `ChildDsarExport` DTO with sections:
  - child
  - parents
  - attendance
  - notes
  - concerns
  - sessions
- Tenant-scoped queries + RLS; cross-tenant attempts return 404.

### Epic 7.3 – Retention & Anonymisation

**Status:** ✅ Skeleton implemented

- `OrgRetentionPolicy` model with retention fields (attendance, staffActivity, auditEvent).
- `RetentionConfigService` resolving per-org policy with defaults.
- Workers retention module:
  - Deletes/soft-deletes old `Attendance`, `StaffActivity`, `AuditEvent` based on policy.
  - Guarded by `RETENTION_ENABLED` env flag; when false, job is a no-op.
- Sensitive tables (`Concern`, `ChildNote`, `Child`) left untouched with TODOs for legal/safeguarding guidance.

### Remaining / TODO

- Finalise retention strategy for safeguarding data (once legal/product direction is clear).
- Add monitoring around retention jobs (log counts processed/affected per run).

---

## Recommended Next Steps (for Cursor / Agents)

1. **Admin UI – Shell & Design System (Epic 5.1)**
   - Build `packages/ui` tokens + primitives.
   - Build `apps/admin` shell (sidebar/topbar/dashboard placeholders).
   - Respect `pathway-admin-ui-rules.mdc` and never import from `Design Branding Guidlines`.

2. **Admin UI – Core lists (Epic 5.2)**
   - People, Children, Parents, Sessions, Attendance, Notices lists + basic details.

3. **Then Safeguarding / Billing UI (Epic 5.3 & 5.4)**
   - Once shell + lists are stable.

Back-end epics (1–4, 7) are considered **MVP-complete**; future changes should be incremental and respect existing rules and models.
