# Nexsteps Marketing Site — Incremental Delivery Plan (apps/web only)

> Scope: **Only `apps/web` and shared marketing packages** (e.g. `packages/pricing`, `packages/ui`).  
> **Do not touch anything in `apps/admin`** as part of this plan.

---

## Phase 0 — Baseline & Gap Analysis (Short, once-off)

**Goal:** Understand what’s already built in `apps/web` and map it onto the new epics, without changing behaviour yet.

**Tasks:**

1. **Inventory current `apps/web` implementation**
   - List existing routes (e.g. `/`, `/pricing`, etc.).
   - Note layout structure (App Router vs Pages Router, existing design system, shared components).
   - Check existing SEO setup: `metadata`, `robots`, `sitemap`, etc.
   - Identify any existing content (MDX, blog, static pages).

2. **Map current features → epics**
   - For each existing route, map to epics:
     - `/` → P0.2 + P0.3
     - `/pricing` → P1.6
     - anything `/resources` → P1.7
     - `/security` if present → P0.5
   - Note what’s already implemented vs missing.

3. **Create a short “web-status.md”**
   - In `apps/web/docs/web-status.md` (or similar), record:
     - Existing pages
     - Gaps per epic
     - Known tech choices (Tailwind, UI primitives, etc.)
   - This becomes the reference for the rest of the work.

**Outputs:**
- `apps/web/docs/web-status.md` with current state + mapping.
- No functional changes yet.

---

## Phase 1 — Hosting, Domain, Canonical (P0.1)

**Goal:** Make `apps/web` production-ready as `https://nexsteps.dev` with clean redirects and SEO fundamentals.

**Tasks:**

1. **Vercel project + DNS**
   - Create or confirm `apps/web` is deployed as a dedicated Vercel project.
   - Attach:
     - `nexsteps.dev` (apex)
     - optionally `www.nexsteps.dev`
   - Point Cloudflare DNS to Vercel (CNAME / A records per Vercel docs).

2. **Canonical host + redirects**
   - In Vercel or `next.config.js`, configure:
     - `www.nexsteps.dev` → `https://nexsteps.dev` (301).
     - Any legacy domains → `https://nexsteps.dev` if needed.
   - Verify via `curl -I https://www.nexsteps.dev` → 301 to apex.

3. **SEO primitives in `apps/web`**
   - Use App Router layout:
     - `apps/web/app/layout.tsx` with:
       - `metadata` base URL set to `https://nexsteps.dev`.
       - Default `title` and `description`.
   - Add:
     - `apps/web/app/robots.ts`
     - `apps/web/app/sitemap.ts`
   - Ensure sitemap only uses canonical host.

**Outputs:**
- Canonical host enforced.
- `robots.txt` and `sitemap.xml` correctly exposed.
- No content change yet, just infra & SEO.

---

## Phase 2 — Core Routing & Layout Scaffolding (P0.2)

**Goal:** Establish the marketing site information architecture and base layout; hook up all core routes (with placeholder content if needed).

**Tasks:**

1. **Route groups + layout**
   - Ensure `apps/web/app` uses App Router with groups:
     - `(marketing)` for main pages
     - `(legal)` for privacy/terms/cookies
     - `(resources)` for MDX content
   - Implement a shared layout component under `(marketing)`:
     - `Navbar` (product, sectors, pricing, resources, security, book demo, login).
     - `Footer` (legal links, copyright).

2. **Scaffold core pages**
   - Routes:
     - `/` (home)
     - `/schools`, `/clubs`, `/churches`, `/charities`
     - `/pricing`
     - `/security`
     - `/resources` (index)
     - `/resources/[slug]` (placeholder for now)
     - `/demo`
     - `/trial`
     - `/privacy`, `/terms`, `/cookies`
   - For now: simple sections with a primary CTA and secondary CTA per page (even if copy is placeholder).

3. **CTA primitives**
   - Create components:
     - `components/cta/PrimaryCta.tsx`
     - `components/cta/SecondaryCta.tsx`
   - Ensure all pages use these, not ad-hoc buttons.

4. **Adapt existing pages**
   - If home/pricing/etc already exist:
     - Move them into `(marketing)` structure.
     - Wrap with the new layout.
     - Replace raw buttons with CTA components.

**Outputs:**
- Site IA in place.
- All core routes exist and render.
- Consistent header/footer and CTAs.

---

## Phase 3 — Sector Template & Segmented Homepage (P0.3)

**Goal:** Create a reusable sector landing template and adapt sector pages + homepage to use it.

**Tasks:**

1. **Sector content config**
   - Add `apps/web/content/sectors.ts` (or `content/sectors/*.ts`):
     - Keys: `schools`, `clubs`, `churches`, `charities`.
     - For each: hero copy, subcopy, testimonials, CTA labels, feature highlights.

2. **Template component**
   - `components/sector/SectorLandingPage.tsx`:
     - Props: title, hero, benefits list, testimonial block, primary/secondary CTAs.
     - Use shared CTA components.

3. **Sector routes**
   - Update `/schools`, `/clubs`, `/churches`, `/charities` to:
     - Read from config.
     - Render `SectorLandingPage`.

4. **Segmented homepage**
   - Refactor `/`:
     - Above-the-fold “Choose your sector” panel with large cards for each sector.
     - Deep links to `/schools`, etc.
     - Optional: call-to-action buttons that prefill sector on `/demo?sector=schools`.

5. **Existing work adaptation**
   - If any sector-specific content already exists, migrate its copy into `content/sectors` and render through the template.

**Outputs:**
- Single source-of-truth for sector content.
- Homepage routes visitors into the right sector quickly.

---

## Phase 4 — Dual CTAs + Lead Capture Backend (P0.4)

**Goal:** Make demo + toolkit CTAs functional, with persistence and email delivery.

**Tasks:**

1. **Lead model + persistence**
   - In backend (likely `apps/api` or Next route handlers under `apps/web/app/api`):
     - Define `Lead` table (if not already):
       - id, name, email, org, role, sector, type (`demo`/`toolkit`/`trial`), notes, consent, source, createdAt.
     - Implement idempotent insert (dedupe by email+type+recent timeframe).

2. **Demo form**
   - `/demo`:
     - Fields: name, email, org, role, sector, message, consent checkbox.
     - POST to `/api/leads/demo`.
     - Show success UI + tracking event.

3. **Trial waitlist form**
   - `/trial`:
     - Fewer fields (name, email, org, sector).
     - POST to `/api/leads/trial` (or `/demo` with type flag).
     - Waitlist confirmation UI.

4. **Toolkit CTA**
   - Add secondary CTA surfaces (e.g. hero, footer, relevant pages) → `/resources/toolkit` or `/demo?type=toolkit`.
   - Implement `/api/leads/toolkit`:
     - Persist lead.
     - Send email with download link:
       - Either signed S3/R2 URL
       - Or `/api/toolkit/download?token=...` link.

5. **Email integration**
   - Wire Resend/SES for:
     - Demo confirmation email.
     - Toolkit email.
   - All send operations pass through a small mailer helper.

6. **Existing work adaptation**
   - Replace any existing demo/contact forms to:
     - Use the new leads endpoints.
     - Use consistent validation and success/error states.

**Outputs:**
- Working demo + toolkit flows with persistence.
- Clear, consistent CTA behaviour across pages.

---

## Phase 5 — Security Page /security (P0.5)

**Goal:** Produce a procurement-friendly `/security` page consistent with Nexsteps’ actual implementation (no admin changes, pure marketing copy and structure).

**Tasks:**

1. **Content source**
   - Create `apps/web/content/security.mdx` or `security.mdx` under `content/`.
   - Sections:
     - Tenant isolation
     - Roles/permissions
     - Auditability
     - Data retention + DSAR
     - Media/file handling
     - Safeguarding stance

2. **Security page**
   - `/security` reads from `security.mdx`.
   - “Last updated” date at top or bottom.
   - Add a controls summary table:
     - Columns: Control, Status, Notes (e.g. Auth, RBAC, RLS, Encryption, Backups, Logging).

3. **Data locations**
   - Add a section describing where data lives (cloud provider/region) once you’ve confirmed it.
   - Keep copy conservative & accurate.

4. **Existing work adaptation**
   - If a minimal `/security` already exists, migrate copy into MDX and align headings/styles.

**Outputs:**
- Procurement-ready `/security` page.
- Easy to update via MDX.

---

## Phase 6 — Pricing Config Package + Page (P1.6)

**Goal:** Establish a single source of truth for pricing and render the marketing pricing page from it.

**Tasks:**

1. **Pricing package**
   - New package: `packages/pricing`:
     - `src/plans.ts` with TS types and config (Starter/Growth/Enterprise, caps, add-ons, notes).
     - Optional zod schema to validate config at build time.

2. **Sync with app billing**
   - Align plan codes/names with backend plan catalogue (already done for Buy Now & admin); do **not** change backend here, just re-use codes.
   - Re-export a subset for marketing only (no internal flags).

3. **Pricing page**
   - `/pricing`:
     - Import config from `packages/pricing`.
     - Render cards/tables for each plan.
     - Include:
       - Included features.
       - Add-ons & overage rules (at high level).
       - Plain language promises (no hidden fees, cancel policy).

4. **Tests**
   - Add snapshot test in `packages/pricing` to detect accidental changes.
   - Optionally a small test in `apps/web` that ensures `pricing` renders without error when config changes.

5. **Existing work adaptation**
   - If a static pricing table already exists, replace it with a config-driven rendering; keep copy but move numbers to config.

**Outputs:**
- Config-driven pricing page.
- Shared plan definitions ready for future Buy Now integration (without touching admin now).

---

## Phase 7 — Resources Engine (MDX) (P1.7)

**Goal:** Build a scalable resources/blog system with MDX.

**Tasks:**

1. **Content pipeline**
   - Choose approach:
     - Contentlayer / Velite (recommended), or
     - Custom MDX loader with frontmatter parsing.
   - Implement `content/resources/*.mdx` with frontmatter:
     - `title`, `slug`, `summary`, `sectorTags`, `topicTags`, `publishedAt`.

2. **Listing + detail**
   - `/resources`:
     - List articles with filters by tag/sector.
     - Optional search.
   - `/resources/[slug]`:
     - Render MDX content with a shared layout (title, date, tags, body).

3. **Sitemap + OG**
   - Ensure `sitemap.ts` includes resource URLs.
   - Add `/app/api/og/route.tsx` (or per-article OG) for dynamic social images (optional).

4. **Existing work adaptation**
   - If any blog/resources are hardcoded:
     - Migrate to MDX and hook into index page.

**Outputs:**
- MDX-based resources system.
- Automated inclusion in sitemap.

---

## Phase 8 — Analytics Wrapper & Events (P1.8)

**Goal:** Wire analytics with a thin wrapper and track key funnel events.

**Tasks:**

1. **Analytics wrapper**
   - `apps/web/lib/analytics.ts`:
     - Expose functions like `trackEvent("cta_demo_click", payload)`.
     - Hide provider details (PostHog / Plausible).

2. **Event tracking**
   - Implement:
     - `cta_demo_click`
     - `demo_submit`
     - `toolkit_download`
     - `pricing_view`
     - `sector_page_view`
     - `app_login_click`
   - Capture UTM + referrer on first landing (store in local storage) and attach to lead submissions.

3. **Dashboards**
   - Add a short `apps/web/docs/analytics.md` describing:
     - Saved queries / dashboards answering:
       - Which sector yields the most demos?
       - Which traffic source yields the most toolkit downloads?

4. **Existing work adaptation**
   - If any analytics is already wired:
     - Consolidate through the new wrapper.
     - Remove direct calls from components.

**Outputs:**
- Typed analytics event layer.
- Funnel visibility for marketing decisions.

---

## Phase 9 — Handoff to App (P2.9)

**Goal:** Make the marketing→app handoff clean and future-proof for self-serve onboarding.

**Tasks:**

1. **Global nav updates**
   - Ensure nav includes:
     - Product (if applicable)
     - Sectors
     - Pricing
     - Resources
     - Security
     - **Book Demo**
     - **Login** (links to `https://app.nexsteps.dev`)

2. **Trial route**
   - `/trial`:
     - v1: Waitlist form (connected to leads backend).
     - Copy that describes what will happen next.
   - Ensure design/layout is stable so the route can later become:
     - “Create your organisation + site” wizard without breaking SEO.

3. **Login CTAs**
   - All “Login” CTAs point to the admin app (`https://app.nexsteps.dev`).
   - Track `app_login_click` via analytics wrapper.

4. **Existing work adaptation**
   - Replace any legacy login/trial links with the new structure and tracking.

**Outputs:**
- Clean handoff from marketing to app.
- `/trial` ready to evolve into self-serve onboarding.

---

## Suggested Implementation Order (Incremental)

You can work roughly in this order to keep things shippable:

1. **Phase 0 → Phase 1**: Baseline + domain wiring (P0.1).
2. **Phase 2 → Phase 3**: IA + sector template + homepage segmentation (P0.2–P0.3).
3. **Phase 4**: Dual CTAs + lead capture flows (P0.4).
4. **Phase 5**: Security page (P0.5).
5. **Phase 6**: Pricing package + page (P1.6).
6. **Phase 7**: Resources engine (P1.7).
7. **Phase 8**: Analytics wrapper + events (P1.8).
8. **Phase 9**: App handoff polish (P2.9).

At each step, adapt any existing `apps/web` work into the new structure rather than rewriting it from scratch — and keep **admin** completely untouched as requested.