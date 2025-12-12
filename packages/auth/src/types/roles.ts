/**
 * Roles as stored on Auth0 tokens for per-tenant permissions.
 * These map directly to the `UserTenantRole` domain entity.
 * TODO(Epic1-Task1.4): confirm role slugs with the Auth0 /rules integration before going live.
 */
export enum UserTenantRole {
  ADMIN = "tenant:admin",
  COORDINATOR = "tenant:coordinator",
  TEACHER = "tenant:teacher",
  STAFF = "tenant:staff",
  PARENT = "tenant:parent",
}

/**
 * Org-level roles live alongside tenant roles so we can gate billing,
 * safeguarding exports, and trust-wide features.
 */
export enum UserOrgRole {
  ORG_OWNER = "org:owner",
  ORG_ADMIN = "org:admin",
  SAFEGUARDING_LEAD = "org:safeguarding_lead",
  BILLING_MANAGER = "org:billing_manager",
  SUPPORT = "org:support",
}

export interface RoleSet {
  org: UserOrgRole[];
  tenant: UserTenantRole[];
}

export const EMPTY_ROLE_SET: RoleSet = { org: [], tenant: [] };

