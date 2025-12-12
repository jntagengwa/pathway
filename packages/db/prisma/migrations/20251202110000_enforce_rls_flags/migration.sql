-- Reapply and force Row Level Security on all tenant-scoped tables.
-- This migration is idempotent thanks to DROP POLICY IF EXISTS guards.

-- Helper predicate snippets
CREATE OR REPLACE FUNCTION app.ensure_rls_enabled(tbl regclass) RETURNS void AS $$
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', tbl);
  EXECUTE format('ALTER TABLE %s FORCE ROW LEVEL SECURITY', tbl);
END;
$$ LANGUAGE plpgsql;

SELECT app.ensure_rls_enabled('"Tenant"'::regclass);
DROP POLICY IF EXISTS "Tenant_rls_all" ON "Tenant";
DROP POLICY IF EXISTS "Tenant_rls_select" ON "Tenant";
DROP POLICY IF EXISTS "Tenant_rls_insert" ON "Tenant";
DROP POLICY IF EXISTS "Tenant_rls_update" ON "Tenant";
DROP POLICY IF EXISTS "Tenant_rls_delete" ON "Tenant";
CREATE POLICY "Tenant_rls_select" ON "Tenant" FOR SELECT
  USING (app.current_tenant_id() IS NOT NULL AND "id" = app.current_tenant_id());
CREATE POLICY "Tenant_rls_insert" ON "Tenant" FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Tenant_rls_update" ON "Tenant" FOR UPDATE
  USING (app.current_tenant_id() IS NOT NULL AND "id" = app.current_tenant_id())
  WITH CHECK (app.current_tenant_id() IS NOT NULL AND "id" = app.current_tenant_id());
CREATE POLICY "Tenant_rls_delete" ON "Tenant" FOR DELETE
  USING (app.current_tenant_id() IS NOT NULL AND "id" = app.current_tenant_id());

SELECT app.ensure_rls_enabled('"Org"'::regclass);
DROP POLICY IF EXISTS "Org_rls_all" ON "Org";
DROP POLICY IF EXISTS "Org_rls_select" ON "Org";
DROP POLICY IF EXISTS "Org_rls_insert" ON "Org";
DROP POLICY IF EXISTS "Org_rls_update" ON "Org";
DROP POLICY IF EXISTS "Org_rls_delete" ON "Org";
CREATE POLICY "Org_rls_select" ON "Org" FOR SELECT
  USING (app.current_org_id() IS NOT NULL AND "id" = app.current_org_id());
CREATE POLICY "Org_rls_insert" ON "Org" FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Org_rls_update" ON "Org" FOR UPDATE
  USING (app.current_org_id() IS NOT NULL AND "id" = app.current_org_id())
  WITH CHECK (app.current_org_id() IS NOT NULL AND "id" = app.current_org_id());
CREATE POLICY "Org_rls_delete" ON "Org" FOR DELETE
  USING (app.current_org_id() IS NOT NULL AND "id" = app.current_org_id());

-- Helper to rebuild simple tenantId policies
CREATE OR REPLACE PROCEDURE app.rebuild_tenant_policy(tbl regclass) AS $$
DECLARE
  table_name text := REGEXP_REPLACE(tbl::text, '^"(.*)"$', '\1');
  policy_name text := table_name || '_tenant_rls';
BEGIN
  PERFORM app.ensure_rls_enabled(tbl);
  EXECUTE format('DROP POLICY IF EXISTS %I ON %s', policy_name, tbl);
  EXECUTE format(
    'CREATE POLICY %I ON %s
       USING (app.current_tenant_id() IS NOT NULL AND "tenantId" = app.current_tenant_id())
       WITH CHECK (app.current_tenant_id() IS NOT NULL AND "tenantId" = app.current_tenant_id())',
    policy_name,
    tbl
  );
END;
$$ LANGUAGE plpgsql;

CALL app.rebuild_tenant_policy('"Child"'::regclass);
CALL app.rebuild_tenant_policy('"Group"'::regclass);
CALL app.rebuild_tenant_policy('"Session"'::regclass);
CALL app.rebuild_tenant_policy('"Lesson"'::regclass);
CALL app.rebuild_tenant_policy('"Announcement"'::regclass);
CALL app.rebuild_tenant_policy('"VolunteerPreference"'::regclass);
CALL app.rebuild_tenant_policy('"User"'::regclass);
CALL app.rebuild_tenant_policy('"UserTenantRole"'::regclass);
CALL app.rebuild_tenant_policy('"AuditEvent"'::regclass);

-- Concern
SELECT app.ensure_rls_enabled('"Concern"'::regclass);
DROP POLICY IF EXISTS "Concern_rls" ON "Concern";
CREATE POLICY "Concern_rls" ON "Concern"
  USING (
    app.current_tenant_id() IS NOT NULL AND EXISTS (
      SELECT 1 FROM "Child" c
      WHERE c."id" = "Concern"."childId"
        AND c."tenantId" = app.current_tenant_id()
    )
  )
  WITH CHECK (
    app.current_tenant_id() IS NOT NULL AND EXISTS (
      SELECT 1 FROM "Child" c
      WHERE c."id" = "Concern"."childId"
        AND c."tenantId" = app.current_tenant_id()
    )
  );

-- ChildNote
SELECT app.ensure_rls_enabled('"ChildNote"'::regclass);
DROP POLICY IF EXISTS "ChildNote_rls" ON "ChildNote";
CREATE POLICY "ChildNote_rls" ON "ChildNote"
  USING (
    app.current_tenant_id() IS NOT NULL AND EXISTS (
      SELECT 1 FROM "Child" c
      WHERE c."id" = "ChildNote"."childId"
        AND c."tenantId" = app.current_tenant_id()
    )
  )
  WITH CHECK (
    app.current_tenant_id() IS NOT NULL AND EXISTS (
      SELECT 1 FROM "Child" c
      WHERE c."id" = "ChildNote"."childId"
        AND c."tenantId" = app.current_tenant_id()
    )
  );

-- Attendance
SELECT app.ensure_rls_enabled('"Attendance"'::regclass);
DROP POLICY IF EXISTS "Attendance_rls" ON "Attendance";
CREATE POLICY "Attendance_rls" ON "Attendance"
  USING (
    app.current_tenant_id() IS NOT NULL AND EXISTS (
      SELECT 1 FROM "Child" c
      WHERE c."id" = "Attendance"."childId"
        AND c."tenantId" = app.current_tenant_id()
    )
  )
  WITH CHECK (
    app.current_tenant_id() IS NOT NULL AND EXISTS (
      SELECT 1 FROM "Child" c
      WHERE c."id" = "Attendance"."childId"
        AND c."tenantId" = app.current_tenant_id()
    )
  );

-- Assignment
SELECT app.ensure_rls_enabled('"Assignment"'::regclass);
DROP POLICY IF EXISTS "Assignment_rls" ON "Assignment";
CREATE POLICY "Assignment_rls" ON "Assignment"
  USING (
    app.current_tenant_id() IS NOT NULL AND EXISTS (
      SELECT 1 FROM "Session" s
      WHERE s."id" = "Assignment"."sessionId"
        AND s."tenantId" = app.current_tenant_id()
    )
  )
  WITH CHECK (
    app.current_tenant_id() IS NOT NULL AND EXISTS (
      SELECT 1 FROM "Session" s
      WHERE s."id" = "Assignment"."sessionId"
        AND s."tenantId" = app.current_tenant_id()
    )
  );

-- SwapRequest
SELECT app.ensure_rls_enabled('"SwapRequest"'::regclass);
DROP POLICY IF EXISTS "SwapRequest_rls" ON "SwapRequest";
CREATE POLICY "SwapRequest_rls" ON "SwapRequest"
  USING (
    app.current_tenant_id() IS NOT NULL AND EXISTS (
      SELECT 1
      FROM "Assignment" a
      JOIN "Session" s ON s."id" = a."sessionId"
      WHERE a."id" = "SwapRequest"."assignmentId"
        AND s."tenantId" = app.current_tenant_id()
    )
  )
  WITH CHECK (
    app.current_tenant_id() IS NOT NULL AND EXISTS (
      SELECT 1
      FROM "Assignment" a
      JOIN "Session" s ON s."id" = a."sessionId"
      WHERE a."id" = "SwapRequest"."assignmentId"
        AND s."tenantId" = app.current_tenant_id()
    )
  );

-- UserOrgRole
SELECT app.ensure_rls_enabled('"UserOrgRole"'::regclass);
DROP POLICY IF EXISTS "UserOrgRole_rls" ON "UserOrgRole";
CREATE POLICY "UserOrgRole_rls" ON "UserOrgRole"
  USING (app.current_org_id() IS NOT NULL AND "orgId" = app.current_org_id())
  WITH CHECK (app.current_org_id() IS NOT NULL AND "orgId" = app.current_org_id());

-- Clean up helpers to avoid leaking objects
DROP PROCEDURE IF EXISTS app.rebuild_tenant_policy(regclass);
DROP FUNCTION IF EXISTS app.ensure_rls_enabled(regclass);

