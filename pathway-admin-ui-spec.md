# PathWay Admin UI Spec (Cursor Prompt Writer Pack)

> Purpose: Use this document as the **single source of truth** for building the **PathWay Admin UI** (not yet mocked) in a way that:
> - Feels like PathWay (subtle “hints” of the mobile UI)
> - Reads as a professional, business-grade SaaS admin product
> - Is implementation-ready for Cursor (component rules, pages, flows, states, and epics)

---

## 1) North Star

### 1.1 What the Admin UI is for
Admin is the operational control plane for organisations running programmes (schools/churches/clubs) to manage:
- **People:** staff/volunteers, parents/guardians, children
- **Programmes & Sessions:** scheduling, rosters, attendance
- **Safeguarding:** concerns/notes workflows, permissions, auditability
- **Comms:** notices, announcements, pickup notifications
- **Compliance & Reporting:** exports, DSAR, audit logs
- **Billing & Entitlements:** plan limits, usage, invoices

### 1.2 Target users (roles)
- **Org Owner / Admin:** full control, billing, users, safeguarding oversight
- **Safeguarding Lead:** access to safeguarding modules + restricted data
- **Programme Manager:** sessions, attendance, notices, lessons
- **Volunteer/Staff:** limited operational access (today/schedule/attendance)

### 1.3 Core product tone
- **Business-first:** dense information, tables, filters, bulk actions
- **Friendly PathWay DNA:** mint accents, soft rounded cards, gentle motion, motif only in empty states/onboarding

---

## 2) Visual System (Admin Theme)

### 2.1 Brand DNA (keep)
- **Mint** as primary brand accent (primary CTAs, active nav, key highlights)
- **Yellow** used as *warning/attention* (not as big backgrounds)
- **Blue** used as *info/secondary accent*
- **Motif** (“stepping stones/curved path”) appears only in:
  - empty states
  - onboarding helpers
  - subtle loading illustrations (optional)

### 2.2 Business UI adjustments (shift)
- Surfaces: mostly **white + light gray**
- Reduce “playful” blocks:
  - use **header bars** in neutral (white/gray), not full mint headers
- Increase information density:
  - tables, split layouts, inspector panels
- Typography:
  - Headings: **Nunito** (600–800)
  - Body/UI: **Quicksand** (400–600)

### 2.3 Spacing / radius
- Use consistent spacing scale (multiples of 4)
- Radius: **8–12px** on admin cards; keep “2xl” rounding only on major CTAs

### 2.4 Accessibility (non-negotiable)
- WCAG 2.1 AA contrast
- Visible `:focus-visible` rings everywhere
- Keyboard navigable menus/dialogs/sheets
- Minimum touch target 44px for interactive controls on tablet + mobile web

---

## 3) Component & Interaction Rules (Cursor must follow)

### 3.1 Allowed primitives (use these first)
Use the shared primitives you already have in the Figma-export kit / shadcn layer:
- layout: `sidebar`, `resizable`, `scroll-area`, `separator`
- navigation: `breadcrumb`, `navigation-menu`, `tabs`, `pagination`
- actions: `button`, `dropdown-menu`, `context-menu`, `menubar`, `command`
- forms: `form`, `label`, `input`, `textarea`, `select`, `radio-group`, `checkbox`, `switch`, `toggle`, `toggle-group`, `slider`, `calendar`
- feedback: `sonner` (toasts), `alert`, `alert-dialog`, `dialog`, `sheet`, `drawer`, `progress`, `skeleton`
- display: `card`, `badge`, `avatar`, `chart`, `collapsible`, `carousel`, `tooltip`, `hover-card`

### 3.2 Standard interaction patterns
- **Filters**
  - Desktop: inline filter row + “More filters” collapsible
  - Small screens: filters open in a **Sheet**
- **Row actions**
  - Tables use `DropdownMenu` (ellipsis) for secondary actions
  - Primary action is a button in header (“Create…”, “Export…”, “Assign…”)
- **Bulk actions**
  - Tables support `Checkbox` selection
  - When `selectedCount > 0`, show a sticky bulk bar with actions
- **Destructive actions**
  - Always via `AlertDialog` (never a plain dialog)
- **Toasts**
  - Use `sonner` for success/error/offline/pending status
- **Loading**
  - Page-level `Skeleton` for initial loads
  - Section-level skeletons for async panels
- **Empty states**
  - Use PathWay motif + clear CTA (“Create…”, “Invite…”, “Sync…”)
- **Command palette**
  - `⌘K / Ctrl+K` opens `Command`
  - Search targets: Users, Children, Sessions, Notices, Concerns
  - Create shortcuts: Notice, Session, Lesson, User invite

---

## 4) Admin Shell (Layout)

### 4.1 App layout blueprint
- **Left Sidebar** (collapsible):
  - Org switcher (top)
  - Primary nav
  - Secondary nav (settings/help)
- **Top Bar**:
  - Breadcrumbs
  - Global search (command palette trigger + input)
  - Notifications
  - User menu
- **Main Content**:
  - page header (title + actions)
  - content grid (KPIs + tables/forms)
- **Right Inspector Panel (optional)**:
  - resizable panel for “Details / Audit / Quick edits”

### 4.2 Responsive behaviour
- Desktop: sidebar visible, inspector optional
- Tablet: sidebar collapsible, inspector becomes a drawer/sheet
- Mobile web: sidebar becomes sheet; filters always sheet; tables collapse to “cards”

---

## 5) Information Architecture & Routes

### 5.1 Primary navigation
1. `/admin/overview`
2. `/admin/orgs` (multi-org only; otherwise hide)
3. `/admin/users`
4. `/admin/children`
5. `/admin/sessions`
6. `/admin/attendance`
7. `/admin/pickups`
8. `/admin/notices`
9. `/admin/lessons`
10. `/admin/safeguarding`
11. `/admin/billing`
12. `/admin/reports`
13. `/admin/settings`
14. `/admin/audit`

---

## 6) Page Specs (Admin)

Each page includes: **Goal**, **Key UI**, **Table columns**, **Filters**, **Actions**, **States**, **Permissions**.

### 6.1 Admin Overview (`/admin/overview`)
**Goal:** At-a-glance operational health, “needs attention”, quick actions.

**Key UI**
- KPI cards row:
  - Today’s sessions
  - Attendance completion %
  - Pickups overdue count
  - Unread urgent notices
  - Safeguarding open cases (lead/admin only)
- Charts:
  - Attendance trend (7/30 days)
  - Pickup SLA trend
- “Needs attention” list:
  - Overdue pickups
  - Sessions missing attendance
  - Urgent notices expiring soon
- Recent activity feed (audit-style)

**Actions**
- Create Notice
- Create Session
- Invite User
- Export Report

**Permissions**
- Safeguarding KPI only for Safeguarding Lead/Admin

### 6.2 Users & Roles (`/admin/users`)
**Table columns**
- Name + avatar
- Email
- Role
- Status (Invited/Active/Disabled)
- Last active
- Site/Team (optional)

**Filters**
- Role, Status, Site, Last active range

**Actions**
- Invite user (dialog)
- Bulk: disable, assign role, assign site/team
- Row actions: resend invite, view audit, disable

### 6.3 Children (`/admin/children`)
**Table columns**
- Child name + avatar (respect photo consent)
- Age group
- Guardians count
- Photo consent status
- Active status
- Last attended

**Filters**
- Age group, Consent, Active, Last attended range

**Actions**
- Add child (dialog)
- Bulk: move age group, export
- Row: view/edit/archive, DSAR export (role gated)

### 6.4 Sessions (`/admin/sessions`)
**Table columns**
- Date/time
- Programme
- Room/site
- Lead
- Staff count
- Children expected
- Attendance status
- Sync status (optional)

**Filters**
- Date range, Programme, Site, Lead, Attendance status

**Actions**
- Create session
- Bulk: assign staff, export roster
- Row: open, duplicate, cancel (alert dialog)

### 6.5 Attendance (`/admin/attendance`)
**Table columns**
- Session
- Completion %
- Present/Late/Absent/Not marked
- Updated by
- Last updated

**Actions**
- Open session to complete
- Export CSV

### 6.6 Pickups (`/admin/pickups`)
**Table columns**
- Child (respect photo consent)
- Status
- Requested time
- Elapsed time
- Assigned staff
- Contact actions
- Notes

**Actions**
- Start/Complete
- Escalate overdue (alert dialog)
- Export pickup log

### 6.7 Notices (`/admin/notices`)
**Table columns**
- Title
- Category
- Urgency
- Target (age groups/sites)
- Read rate %
- Status
- Published date

**Actions**
- Create notice
- Row: duplicate, edit, analytics, expire (alert dialog)

### 6.8 Lessons (`/admin/lessons`)
**Table columns**
- Title
- Age group
- Tags
- Owner
- Visibility
- Updated

**Actions**
- Upload lesson
- Row: download/share/edit/delete (alert dialog)

### 6.9 Safeguarding (`/admin/safeguarding`)
**Table columns**
- Case ID
- Child
- Severity
- Status
- Assigned to
- Created date
- Last updated

**Permissions**
- Only Safeguarding Lead/Admin
- Show “Access is monitored” microcopy

### 6.10 Billing (`/admin/billing`)
- Plan card + usage meters (AV30, storage, exports)
- Invoices table
- Admin/Owner only

### 6.11 Reports (`/admin/reports`)
- Report cards + export job queue (progress + download)
- Role-gated for sensitive exports

### 6.12 Settings (`/admin/settings`)
- Tabs: Org profile, Sites, Age groups, Notifications, Security, Integrations
- Use tooltips/hovercards for explanations

### 6.13 Audit (`/admin/audit`)
**Table columns**
- Timestamp
- Actor
- Action
- Entity
- Outcome
- IP/device (optional)

**Actions**
- Export audit log (role gated)

---

## 7) Permissions & Data Protection
- Hide modules the role cannot access; deep links show “No access”.
- **Photo consent:** never show child photo unless `hasPhotoConsent === true`.
- Safeguarding exports/actions show “This action will be logged.”

---

## 8) UI Epic Breakdown (for your UI epics board)
- **EPIC A** — Admin Shell & Navigation
- **EPIC B** — Overview
- **EPIC C** — Users & Roles
- **EPIC D** — Children & Consents
- **EPIC E** — Sessions & Rota
- **EPIC F** — Attendance
- **EPIC G** — Pickups Ops
- **EPIC H** — Notices
- **EPIC I** — Lessons
- **EPIC J** — Safeguarding
- **EPIC K** — Billing & Entitlements
- **EPIC L** — Reports & Exports
- **EPIC M** — Settings
- **EPIC N** — Audit Log

---

## 9) Cursor “Master Prompt” (paste into your prompt writer)

```md
You are building the PathWay Admin UI for a multi-tenant platform.

Hard constraints:
- Use existing shadcn/radix primitives in the repo: sidebar, resizable, table, pagination, sheet, dialog, alert-dialog, dropdown-menu, command, form, input/select/checkbox, skeleton, sonner, chart, breadcrumb, navigation-menu, tabs.
- Business style: neutral surfaces, mint is the primary accent; yellow/blue are semantic (warning/info).
- Accessibility: WCAG 2.1 AA, visible focus, keyboard nav, 44px touch targets.
- Data safety: never render child photos unless hasPhotoConsent is true; safeguarding is strictly role gated and all actions/exports are logged.

Build order:
1) AdminLayout shell (sidebar/topbar/breadcrumb + responsive).
2) Shared patterns: filter row, table with selection & pagination, inspector panel, empty/skeleton/error states, sonner toasts.
3) Routes in order: Overview → Users → Children → Sessions → Attendance → Pickups → Notices → Lessons → Safeguarding → Billing → Reports → Settings → Audit.
4) Every page must include: loading/empty/error states, permissions gating, and route-level page header actions.

Use the detailed page specs from this document to implement each page.
```

---

## 10) Acceptance Criteria
For every admin page/route:
- Layout matches Admin Shell rules (sidebar/topbar/breadcrumb)
- Uses shared primitives (no bespoke one-offs unless necessary)
- Has loading/empty/error states
- Works desktop/tablet/mobile web
- Role gating + safe “no access”
- Uses sonner toasts
- Tables paginate; bulk actions where relevant
- Destructive actions use AlertDialog
- Photo consent enforced everywhere
- Safeguarding shows “Access is monitored” and is audit-linked
