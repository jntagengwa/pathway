-- Create helper schema/functions for tenant-aware RLS predicates
CREATE SCHEMA IF NOT EXISTS app;

CREATE OR REPLACE FUNCTION app.current_tenant_id() RETURNS text AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app.current_org_id() RETURNS text AS $$
  SELECT NULLIF(current_setting('app.org_id', true), '')
$$ LANGUAGE sql STABLE;

-- Tenant table: lock each row to its own tenant
-- Note: Tenant/Org need special handling for bootstrap (creating new tenants).
-- We allow INSERT when no context is set (bootstrap), but SELECT/UPDATE require context.
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tenant" FORCE ROW LEVEL SECURITY;
CREATE POLICY "Tenant_rls_select" ON "Tenant" FOR SELECT
  USING (app.current_tenant_id() IS NOT NULL AND "id" = app.current_tenant_id());
CREATE POLICY "Tenant_rls_insert" ON "Tenant" FOR INSERT
  WITH CHECK (true);  -- Allow creating tenants (bootstrap scenario)
CREATE POLICY "Tenant_rls_update" ON "Tenant" FOR UPDATE
  USING (app.current_tenant_id() IS NOT NULL AND "id" = app.current_tenant_id())
  WITH CHECK (app.current_tenant_id() IS NOT NULL AND "id" = app.current_tenant_id());
CREATE POLICY "Tenant_rls_delete" ON "Tenant" FOR DELETE
  USING (app.current_tenant_id() IS NOT NULL AND "id" = app.current_tenant_id());

-- Org table: similar bootstrap-friendly policies
ALTER TABLE "Org" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Org" FORCE ROW LEVEL SECURITY;
CREATE POLICY "Org_rls_select" ON "Org" FOR SELECT
  USING (app.current_org_id() IS NOT NULL AND "id" = app.current_org_id());
CREATE POLICY "Org_rls_insert" ON "Org" FOR INSERT
  WITH CHECK (true);  -- Allow creating orgs (bootstrap scenario)
CREATE POLICY "Org_rls_update" ON "Org" FOR UPDATE
  USING (app.current_org_id() IS NOT NULL AND "id" = app.current_org_id())
  WITH CHECK (app.current_org_id() IS NOT NULL AND "id" = app.current_org_id());
CREATE POLICY "Org_rls_delete" ON "Org" FOR DELETE
  USING (app.current_org_id() IS NOT NULL AND "id" = app.current_org_id());

-- Generic policy for tables that expose tenantId directly
DO $$
DECLARE
  tbl text;
  policy_name text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'Child',
    'Group',
    'Session',
    'Lesson',
    'Announcement',
    'VolunteerPreference',
    'User',
    'UserTenantRole',
    'AuditEvent'
  ]
  LOOP
    policy_name := tbl || '_tenant_rls';
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', tbl);
    EXECUTE format(
      'CREATE POLICY %I ON %I
         USING (app.current_tenant_id() IS NOT NULL AND "tenantId" = app.current_tenant_id())
         WITH CHECK (app.current_tenant_id() IS NOT NULL AND "tenantId" = app.current_tenant_id());',
      policy_name,
      tbl
    );
  END LOOP;
END;
$$;

-- Concern rows inherit tenant from their child
ALTER TABLE "Concern" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Concern" FORCE ROW LEVEL SECURITY;
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

-- Child notes inherit tenant from the linked child
ALTER TABLE "ChildNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChildNote" FORCE ROW LEVEL SECURITY;
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

-- Attendance inherits tenant via the child
ALTER TABLE "Attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attendance" FORCE ROW LEVEL SECURITY;
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

-- Assignments inherit tenant via their session -> tenant relationship
ALTER TABLE "Assignment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Assignment" FORCE ROW LEVEL SECURITY;
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

-- Swap requests inherit tenant via their assignment -> session chain
ALTER TABLE "SwapRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SwapRequest" FORCE ROW LEVEL SECURITY;
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

-- UserOrgRole is scoped by org
ALTER TABLE "UserOrgRole" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserOrgRole" FORCE ROW LEVEL SECURITY;
CREATE POLICY "UserOrgRole_rls" ON "UserOrgRole"
  USING (app.current_org_id() IS NOT NULL AND "orgId" = app.current_org_id())
  WITH CHECK (app.current_org_id() IS NOT NULL AND "orgId" = app.current_org_id());

