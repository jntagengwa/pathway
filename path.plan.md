PathWay Technical Assessment & Roadmap

1. Current Codebase Structure
   Apps
   apps/api: NestJS API with modules for tenants, users, groups, children, attendance, lessons, sessions, assignments, preferences, swaps, announcements, notes, concerns, orgs, and billing. Uses a shared Prisma client from @pathway/db and Zod/class-validator style DTOs. Global ValidationPipe is enabled in apps/api/src/main.ts.
   apps/admin: Next.js App Router app present but app/ is currently empty (no routes, layouts, or UI shell implemented).
   apps/mobile: Expo/React Native app folder present but app/ is empty (no navigation or screens yet).
   Workers: No apps/workers directory in the actual filesystem, so no background jobs implemented yet (including AV30 or other batch tasks).
   Packages
   packages/db: Prisma schema and client bootstrap (packages/db/prisma/schema.prisma, packages/db/src/index.ts), migrations, and a suite-oriented seed script (seed.ts). This is the main source of truth for multi-tenancy, safeguarding, and billing models.
   packages/config: Shared ESLint/Prettier/TSConfig setup.
   packages/types, packages/ui, packages/util: Present but src/ folders are empty; no shared domain types, design system, or utilities yet.
2. Where Key Concerns Are Implemented vs Missing
   2.1 Multi-tenancy & Tenant/Org Scoping
   Implemented
   Data model: Tenant, Org, UserTenantRole, UserOrgRole, and tenant-scoped entities (Child, Group, Session, Lesson, Announcement, VolunteerPreference) are defined with tenantId/orgId fields and indexes in schema.prisma.
   Service-level guardrails:
   ChildrenService, UsersService, GroupsService, AttendanceService, SessionsService, AnnouncementsService all perform explicit tenant consistency checks when creating/updating data (e.g. ensuring group.tenantId === child.tenantId, validating tenant existence before create).
   TenantsService and OrgsService centralise creation of tenants and orgs, including uniqueness checks for slugs.
   Missing / Gaps
   Request-scoped tenant resolution: No auth/tenant guard layer; controllers accept tenantId via DTOs or query params rather than deriving from JWT/org context.
   List endpoints not forced to tenant scope:
   UsersService.list, GroupsService.list, OrgsService.list, and several findAll methods (e.g. ConcernsService.findAll, NotesService.findAll) do not require tenant filters, which would leak cross-tenant data if RLS is not enforced.
   No shared @pathway/auth package or Nest guards for tenant/role extraction from Auth0 tokens.
   2.2 Row-Level Security (RLS)
   Implemented
   Prisma schema and migrations define tables and FKs only; there are no RLS policies or tenant-aware Postgres roles in the migrations inspected (e.g. 20250909134602_init/migration.sql).
   Missing / Gaps
   No RLS policies defined on multi-tenant tables (Tenant, User, Child, Group, Session, Attendance, Lesson, Announcement, etc.).
   No DB session tenant-context pattern (e.g. setting current_setting('app.tenant_id')) to support RLS.
   Tests currently use TRUNCATE ... CASCADE via resetDatabase in packages/db/src/index.ts but do not verify RLS behaviour.
   2.3 Safeguarding (Concerns, Notes, RBAC, Audit)
   Implemented
   Models: Concern and ChildNote exist in Prisma schema with links to Child and User (author) for basic safeguarding/pastoral data.
   API modules: concerns and notes modules provide CRUD endpoints with validation (createConcernDto, createNoteDto) and clear error mapping. They validate foreign keys (child and author existence).
   Missing / Gaps
   RBAC: No role-based access control at all. Anyone hitting the API could create/read/update/delete Concern and ChildNote records; no restriction to safeguarding roles, and no separation between staff and parents.
   Tenant scoping: ConcernsService.findAll and NotesService.findAll filter only by childId/authorId, not tenant. Without RLS or tenant-aware queries, cross-tenant leakage is possible.
   Audit logging: There is no audit trail for reads/creates/updates of safeguarding entities or child profiles; no dedicated audit model in Prisma.
   Parent visibility rules for Positive Notes: ChildNote has no visibility/approved flags and no logic restricting what parents can see.
   2.4 AV30 Billing & Usage Tracking
   Implemented
   Billing domain in Prisma: Org, Subscription, OrgEntitlementSnapshot, UsageCounters, BillingEvent, BillingProvider/SubscriptionStatus enums are defined in schema.prisma and migrations.
   Org registration flow: OrgsService.register orchestrates org creation, optional initial tenant, optional admin assignment, and calls BillingService.checkout to start billing (apps/api/src/orgs/orgs.service.ts).
   Billing service: BillingService is a stubbed adapter around a fake “Stripe” provider returning a safe checkoutUrl, with good separation for future real provider integration.
   Missing / Gaps
   AV30 computation: No workers or jobs exist to calculate AV30 (no apps/workers, no cron/queue integration, no logic writing to UsageCounters).
   Usage enforcement: API modules do not consult OrgEntitlementSnapshot or UsageCounters to enforce caps (e.g. blocking new announcements when above 120% AV30).
   Event tracking: Attendance, assignments, rota responses, etc. do not emit AV30-relevant activity events.
   Webhook handling: billing/webhook.controller.ts is empty; no handling of provider webhooks or updates to subscription/entitlement state.
   2.5 Data Minimisation & PII
   Implemented
   Scoped PII: Core PII is mostly limited to necessary fields (e.g. Child.firstName/lastName, User.email/name, Child.allergies/disabilities). Photos are referenced via photoKey (implying S3 or similar), not raw binary in DB.
   Validation & normalisation: Services trim and normalise inputs (e.g. emails, names), reducing junk data.
   Missing / Gaps
   Logging of potentially sensitive data: OrgsService.register and OrgsController log raw DTOs and validation errors including emails and billing-related fields to stdout.
   No explicit retention/anonymisation logic: Schema doesn’t include retention metadata, and API/services have no DSAR export or deletion pathways.
   No explicit “minimal projection” layer: Many findOne and findMany return full records rather than minimal DTOs specifically designed for each role.
   2.6 Figma-based Design System & UI Consistency
   Implemented
   None in code yet. UI packages and app shells are present as scaffolding only.
   Missing / Gaps
   Design system: packages/ui/src is empty; no tokens, components, or layout primitives.
   Admin app shell: apps/admin/app has no layout.tsx, navigation, or pages; nothing mirrors the Figma admin prototype.
   Mobile experience: apps/mobile/app lacks navigation, screens, offline storage, or staff/parent “spaces”.
3. Major Architectural Smells / Gaps
   No auth/tenant context: API assumes unauthenticated access and relies on caller-supplied IDs; this conflicts with multi-tenant and safeguarding requirements.
   Inconsistent tenant scoping in list/read paths: Some services filter by tenant, others don’t; this must be unified and likely driven from auth context + RLS.
   Safeguarding not treated as special: Concerns and ChildNotes are simple CRUD, with no RBAC, audit, or UX distinction.
   Billing models ahead of usage logic: Billing schema is relatively advanced compared with the absence of AV30 computation/enforcement or webhook handling.
   UI & design system missing: All Figma-aligned UI work is still to be done.

---

Epics / Milestones
Epic 1: Multi-tenancy, Auth & RLS Foundation
Goal & impact: Establish secure, tenant-isolated access across the API using Auth0, Nest guards, and Postgres RLS. This underpins safeguarding and billing correctness.
Key areas: apps/api/src/**, packages/db/prisma/**, a new packages/auth (or similar), test setup files in apps/api.
Dependencies: None (foundational for other epics). Must precede safeguarding and AV30 enforcement.
Risks/compliance: High – mistakes can leak cross-tenant data or over-restrict access. Changes to DB policies require careful migration and test coverage.
Tasks
**1.1 Design auth & tenant context interface [MANUAL REVIEW REQUIRED]**
Define how Auth0 org/tenant/roles map into Tenant, Org, UserTenantRole, UserOrgRole. Implement a Nest AuthGuard and a request-scoped context service exposing currentOrgId, currentTenantId, and roles.
Likely files: new packages/auth/src/**, apps/api/src/common/**, controller decorators and guards.
**1.2 Add Postgres RLS policies for multi-tenant tables [MANUAL REVIEW REQUIRED]**
Extend Prisma migrations with RLS setup (policies per table ensuring tenantId = current_setting('app.tenant_id'), etc.) plus infrastructure for setting that per-connection.
Files: new migration SQL files under packages/db/prisma/migrations/** and DB bootstrap scripts.
**1.3 Wire auth/tenant guards into API modules [SAFE WITH REVIEW]**
Add guards/decorators to all controllers to require authentication and derive tenant from JWT/org instead of accepting arbitrary tenantId in requests, falling back only where explicitly safe.
Files: apps/api/src/**.controller.ts, shared Nest guard modules.
**1.4 Normalise list/read queries to be tenant-scoped [SAFE]**
Update UsersService.list, GroupsService.list, OrgsService.list, AnnouncementsService.findAll, NotesService.findAll, ConcernsService.findAll, etc., so they must use the resolved tenant (and org for suite context) rather than returning global data.
Files: apps/api/src/users/users.service.ts, groups.service.ts, orgs.service.ts, announcements.service.ts, notes.service.ts, concerns.service.ts.
**1.5 Add RLS-focused integration tests [SAFE]**
Introduce tests that simulate requests from two tenants and assert that cross-tenant access is denied both at app level and at DB level (where possible via separate DB roles/contexts).
Files: apps/api/src/**/tests/\*.e2e.spec.ts, apps/api/test.setup.e2e.ts, packages/db/src/index.ts.
Epic 2: Safeguarding & Pastoral Flows (Concerns & Notes)
Goal & impact: Treat safeguarding entities (Concern, ChildNote) as highly sensitive with strict RBAC, audit logging, and parent visibility rules aligned with safeguarding guidance.
Key areas: apps/api/src/concerns/**, apps/api/src/notes/**, packages/db/prisma/schema.prisma, new audit logging module, tests.
Dependencies: Requires Epic 1’s auth & tenant context; RLS strongly recommended before exposing in production.
Risks/compliance: Very high – changes directly affect safeguarding confidentiality; manual review required.
Tasks
**2.1 Define safeguarding RBAC rules & enforcement [MANUAL REVIEW REQUIRED]**
Specify which roles can create/read/update/delete Concern and ChildNote records, and which roles (if any) see them in list endpoints. Implement Nest guards/interceptors enforcing these rules.
Files: new safeguarding guard module under apps/api/src/common/safeguarding/**, plus changes to concerns.controller.ts, notes.controller.ts.
**2.2 Add audit logging model & service [MANUAL REVIEW REQUIRED]**
Extend Prisma with an AuditEvent model capturing actor, tenant, entity type/id, action, and timestamp, and create a small service to write events for safeguarding-related operations.
Files: packages/db/prisma/schema.prisma, new migration, new apps/api/src/audit/** module.
**2.3 Instrument safeguarding endpoints with audit events [SAFE WITH REVIEW]**
On create/update/delete/read of Concern and ChildNote, emit audit records while ensuring no sensitive PII is logged beyond what’s necessary for traceability.
Files: concerns.service.ts, concerns.controller.ts, notes.service.ts, notes.controller.ts.
**2.4 Implement parent-facing visibility rules for positive notes [MANUAL REVIEW REQUIRED]**
Add visibility/approval fields to ChildNote and APIs to control which notes are visible to parents vs staff only, aligned with org-level settings.
Files: schema.prisma, notes DTOs & services, later apps/mobile and apps/admin UI.
**2.5 Safeguarding-specific tests [SAFE]**
Add tests verifying that unauthorised roles and cross-tenant contexts cannot access safeguarding data, and that audit logs are written for allowed operations.
Files: apps/api/src/concerns/tests/**, apps/api/src/notes/tests/**, shared test helpers.
Epic 3: Attendance, Scheduling & AV30 Usage Tracking
Goal & impact: Tie attendance and scheduling flows into AV30 usage metrics, enabling accurate billing and operational reporting.
Key areas: apps/api/src/attendance/**, apps/api/src/assignments/**, apps/api/src/sessions/**, packages/db/prisma/schema.prisma, a new worker app for scheduled jobs.
Dependencies: Epic 1 (auth/tenant) for correct per-org counting; partially Epic 4 (billing) for entitlements.
Risks/compliance: Medium–high; touches billing semantics (AV30) and must be reviewed.
Tasks
**3.1 Define AV30 event model & counting rules in code [MANUAL REVIEW REQUIRED]**
Translate AV30 definition into concrete events (e.g. AttendanceRecorded, AssignmentAccepted, AssignmentPublished) and specify how they map to staff identities.
Files: new shared domain types in packages/types/src/av30.ts, comments in relevant services.
**3.2 Emit AV30-relevant events from API flows [SAFE WITH REVIEW]**
On attendance creation, assignment updates, and rota actions, record lightweight events (e.g. into a simple StaffActivity table or queue) tagged with orgId/tenantId and timestamp.
Files: attendance.service.ts, assignments.service.ts, sessions.service.ts, plus new model/migration.
**3.3 Implement nightly AV30 job in workers [MANUAL REVIEW REQUIRED]**
Create apps/workers with BullMQ-based job that computes AV30 for each org from the past 30 days of staff activity, writing to UsageCounters.
Files: new apps/workers/src/**, changes to packages/db/prisma/schema.prisma if a StaffActivity or similar table is introduced.
**3.4 Add AV30-focused tests [SAFE]**
Integration tests that seed activity data, run the AV30 job (synchronously in tests), and assert expected UsageCounters.av30 values and boundaries.
Files: apps/workers/tests/**, apps/api e2e tests that verify counts after typical flows.
Epic 4: Billing, Entitlements & Enforcement
Goal & impact: Use AV30 and entitlements to enforce plan limits, surface friendly warnings, and integrate more fully with Stripe/GoCardless while keeping PII and secrets safe.
Key areas: apps/api/src/billing/**, apps/api/src/orgs/**, Prisma billing models.
Dependencies: Epic 3’s AV30 metrics; Epic 1’s auth/tenant context.
Risks/compliance: High – billing logic affects revenue and customer experience; manual review mandatory.
Tasks
**4.1 Flesh out billing webhook handling [MANUAL REVIEW REQUIRED]**
Implement billing/webhook.controller.ts to validate provider signatures, update Subscription, OrgEntitlementSnapshot, and BillingEvent safely.
Files: apps/api/src/billing/webhook.controller.ts, new tests, env/config handling.
**4.2 Implement entitlements resolution service [SAFE WITH REVIEW]**
Add a small service to resolve an org’s current entitlements (AV30 caps, seats, storage) from OrgEntitlementSnapshot and subscription status.
Files: new apps/api/src/billing/entitlements.service.ts, possibly packages/types.
**4.3 Enforce AV30 soft/hard caps in critical flows [MANUAL REVIEW REQUIRED]**
Integrate entitlements checks into publishing announcements, creating rotas/schedules, etc., enforcing 100–110–120% behaviour described in the rules.
Files: announcements.service.ts, sessions.service.ts, assignments.service.ts, possibly a shared interceptor.
**4.4 Clean up logging & PII in billing/org flows [SAFE]**
Remove or sanitise logs in OrgsService/OrgsController and any new billing code to avoid leaking emails or billing tokens while still preserving observability.
Files: apps/api/src/orgs/orgs.service.ts, orgs.controller.ts, billing module.
Epic 5: Admin Web UI Shell & Design System
Goal & impact: Implement a Figma-aligned admin app shell and shared design system to support all web admin workflows.
Key areas: apps/admin/app/**, packages/ui/src/**, packages/config for styling setup.
Dependencies: None for initial shell and components, but full flows will depend on API/auth being stable (Epic 1).
Risks/compliance: Medium; mainly UX/consistency. Must respect data minimisation and safeguarding in what is shown.
Tasks
**5.1 Establish design tokens & base components [SAFE]**
Define semantic colour, typography, spacing, and radius tokens and create core components (e.g. Button, Card, PageShell) matching Figma.
Files: packages/ui/src/theme.ts, packages/ui/src/components/**.
**5.2 Build admin app shell (layout + navigation) [SAFE]**
Implement layout.tsx, sidebar nav, and top bar (org switcher, user menu, billing notices) aligned with the Figma structure.
Files: apps/admin/app/layout.tsx, apps/admin/app/(routes)/**, shared shell components in packages/ui.
**5.3 Implement initial dashboard screen [SAFE]**
Create a dashboard page showing Today’s sessions, pending attendance, open concerns, and recent announcements using the design system.
Files: apps/admin/app/(dashboard)/page.tsx, data-fetching hooks/services.
**5.4 Wire API integration with proper tenant context [SAFE WITH REVIEW]**
Connect the admin UI to the API using Auth0 tokens, deriving tenantId from org context rather than user input and ensuring no cross-tenant leakage.
Files: apps/admin/app/**, any new packages/auth helpers.
Epic 6: Mobile Staff “Today” View & Offline Attendance
Goal & impact: Deliver a staff-facing mobile experience for daily sessions and attendance with offline capability, aligned with the Figma mobile flows.
Key areas: apps/mobile/app/**, future offline storage utilities (e.g. in packages/util), attendance/sessions APIs.
Dependencies: Epics 1–3 (auth/tenant, safeguarding, AV30) for correct access patterns; some shared design tokens could be reused.
Risks/compliance: High; must strictly limit offline PII and ensure safeguarding content is handled appropriately.
Tasks
**6.1 Set up Expo navigation & basic tab/stack structure [SAFE]**
Implement parent and staff spaces with navigation that mirrors Figma (e.g. Today, Classes, Attendance, Notes).
Files: apps/mobile/app/\_layout.tsx, apps/mobile/app/(tabs)/**.
**6.2 Implement Staff “Today” view [SAFE WITH REVIEW]**
Build a screen listing today’s sessions for the current staff user with quick access to start/continue attendance and note logging.
Files: apps/mobile/app/staff/today.tsx (or equivalent), API hooks.
**6.3 Add offline attendance capture & sync [MANUAL REVIEW REQUIRED]**
Introduce offline storage (e.g. SQLite/AsyncStorage) and a sync engine that queues attendance changes for later submission, with explicit “synced/pending/failed” states.
Files: offline utilities in apps/mobile/app/lib/** or packages/util, modifications to attendance endpoints to support idempotent sync.
Epic 7: Observability, Audit & Data Governance
Goal & impact: Provide operational visibility and GDPR/UK DPA-aligned data governance (DSAR, retention, anonymisation) across the platform.
Key areas: cross-cutting across apps/api, packages/db, and possibly infra scripts.
Dependencies: Builds on auth/tenant (Epic 1) and safeguarding audit (Epic 2). Can be run in parallel with UI work.
Risks/compliance: High from a regulatory standpoint.
Tasks
**7.1 Introduce structured application logging [SAFE WITH REVIEW]**
Standardise logging (e.g. Winston/Pino) with redaction of PII and secrets, and structured fields for tenantId, orgId, and userId.
Files: apps/api/src/main.ts, shared logging utilities.
**7.2 Implement DSAR export for a child/person [MANUAL REVIEW REQUIRED]**
Add an internal/admin-only API to export all data associated with a child/family in a structured, human-readable format.
Files: new controller/service under apps/api/src/dsar/**, queries spanning children, attendance, notes, concerns, etc.
**7.3 Add retention & anonymisation workflows [MANUAL REVIEW REQUIRED]\*\*
Introduce retention configuration (per org) and background jobs for anonymising or deleting aged data (especially attendance and safeguarding) consistent with policy.
Files: schema.prisma for retention metadata, apps/workers for retention jobs, associated tests.

---

4. Prioritisation & Quick Wins
   Recommended Order of Execution
   Epic 1: Multi-tenancy, Auth & RLS Foundation – all other work depends on correct isolation and tenant context.
   Epic 2: Safeguarding & Pastoral Flows – lock down sensitive data access and add audit trails.
   Epic 3: Attendance, Scheduling & AV30 Usage Tracking – connect core operational flows to billing semantics.
   Epic 4: Billing, Entitlements & Enforcement – complete the billing story and enforce plan limits.
   Epic 5: Admin Web UI Shell & Design System – provide admin UX grounded in Figma.
   Epic 6: Mobile Staff “Today” View & Offline Attendance – deliver staff workflows with offline support.
   Epic 7: Observability, Audit & Data Governance – round out compliance and operational visibility (some tasks can start earlier in parallel).
   Quick Wins (Low-Risk, High-Value Tasks)
   QW1: Normalise list endpoints to always accept/use tenant filters
   Tighten list/findAll methods to require a tenant context (even before full auth/guards) and add tests to prevent accidental cross-tenant leakage.
   Files: users.service.ts, groups.service.ts, announcements.service.ts, concerns.service.ts, notes.service.ts, orgs.service.ts. **[SAFE]**
   QW2: Remove or sanitise PII from org/billing logs
   Replace raw DTO logging in OrgsService and OrgsController with structured, redacted logs or remove them entirely for production.
   Files: apps/api/src/orgs/orgs.service.ts, apps/api/src/orgs/orgs.controller.ts. **[SAFE]**
   QW3: Introduce a simple AuditEvent model (without yet wiring every flow)
   Add the Prisma model and migrations for audit events, plus a barebones service, without yet instrumenting all endpoints.
   Files: packages/db/prisma/schema.prisma, new migration, new apps/api/src/audit/audit.service.ts. **[SAFE WITH REVIEW]**
   QW4: Create initial design tokens file in packages/ui
   Define semantic colour and typography tokens mirroring Figma; no app UI changes yet, just the token structure.
   Files: packages/ui/src/theme.ts. **[SAFE]**
   QW5: Add AV30 & billing-related comments/tests placeholders
   Document where AV30 events will be emitted and add TODO-style tests outlining expected behaviour, aiding future implementation.
   Files: attendance.service.spec.ts, assignments.service.spec.ts, new billing tests. **[SAFE]**

---

5. First 3 Agent-Mode Tasks to Run
   You can paste these as-is as individual Agent tasks:

"Tighten tenant scoping on list endpoints in the Nest API"
Instruction: "Update users, groups, announcements, notes, concerns, and orgs services/controllers so that all list/findAll endpoints are explicitly tenant-scoped (using a tenantId parameter for now), and add/adjust tests to ensure no cross-tenant data is returned. Do not introduce auth yet; keep behaviour backwards-compatible except for preventing cross-tenant reads."
"Remove or redact PII in org registration logs"
Instruction: "Review apps/api/src/orgs/orgs.service.ts and apps/api/src/orgs/orgs.controller.ts and remove or redact any logging that outputs full DTOs, emails, or billing-related fields, replacing them with minimal, non-PII structured logs where necessary. Ensure tests still pass."
"Introduce an AuditEvent Prisma model and service"
Instruction: "Extend packages/db/prisma/schema.prisma with an AuditEvent model for recording sensitive operations (actor, tenant, entity type/id, action, timestamp); add a migration, and create a small apps/api/src/audit/audit.service.ts with a typed record method. Do not yet instrument any controllers; just make the model and service ready for use, with unit tests for the service."
