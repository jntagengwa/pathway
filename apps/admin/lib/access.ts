/**
 * Admin access control helpers
 * 
 * Defines role-based permissions for the admin app.
 * Queries UserOrgRole, UserTenantRole, OrgMembership, and SiteMembership tables via API.
 */

import type { UserRolesResponse } from "./api-client";

export type AdminRoleInfo = {
  isOrgAdmin: boolean;
  isOrgOwner: boolean;
  isSiteAdmin: boolean;
  isStaff: boolean;
  isSafeguardingStaff: boolean;
};

/**
 * Extract role information from API response
 * 
 * Queries the database via /auth/active-site/roles endpoint which checks:
 * - UserOrgRole table (org-level roles)
 * - UserTenantRole table (site-level roles)
 * - OrgMembership table (org-level memberships)
 * - SiteMembership table (site-level memberships)
 */
export function getAdminRoleInfoFromApiResponse(
  rolesResponse: UserRolesResponse | null | undefined,
): AdminRoleInfo {
  // Default: assume staff-level access only (safest fallback)
  const defaultRole: AdminRoleInfo = {
    isOrgAdmin: false,
    isOrgOwner: false,
    isSiteAdmin: false,
    isStaff: true,
    isSafeguardingStaff: false,
  };

  if (!rolesResponse) {
    // In dev mode, temporarily grant admin access for testing
    // TODO: Remove this once auth is properly wired
    if (process.env.NODE_ENV === "development") {
      return {
        isOrgAdmin: true,
        isOrgOwner: false,
        isSiteAdmin: true,
        isStaff: true,
        isSafeguardingStaff: false,
      };
    }
    return defaultRole;
  }

  // Check org roles from both sources
  const orgRoles = new Set<string>();
  rolesResponse.orgRoles.forEach((r) => orgRoles.add(r.role));
  rolesResponse.orgMemberships.forEach((m) => orgRoles.add(m.role));

  // Check site roles from both sources
  const siteRoles = new Set<string>();
  rolesResponse.siteRoles.forEach((r) => siteRoles.add(r.role));
  rolesResponse.siteMemberships.forEach((m) => siteRoles.add(m.role));

  // Determine permissions
  const isOrgAdmin = orgRoles.has("ORG_ADMIN");
  const isOrgOwner = orgRoles.has("ORG_OWNER"); // Note: ORG_OWNER not in current enum, but checking for future
  const isSiteAdmin = siteRoles.has("SITE_ADMIN");
  const isStaff =
    siteRoles.has("STAFF") ||
    siteRoles.has("TEACHER") ||
    siteRoles.has("VIEWER") ||
    (!isOrgAdmin && !isSiteAdmin);

  // TODO: Wire safeguarding lead flag from backend when available
  const isSafeguardingStaff = false;

  return {
    isOrgAdmin,
    isOrgOwner,
    isSiteAdmin,
    isStaff,
    isSafeguardingStaff,
  };
}

/**
 * Check if user can access admin-only sections
 * (Reports, Settings, People management, etc.)
 */
export function canAccessAdminSection(role: AdminRoleInfo): boolean {
  return role.isOrgAdmin || role.isOrgOwner || role.isSiteAdmin;
}

/**
 * Check if user can access billing & subscription management
 * Restricted to org admins and owners only
 */
export function canAccessBilling(role: AdminRoleInfo): boolean {
  return role.isOrgAdmin || role.isOrgOwner;
}

/**
 * Check if user can access safeguarding admin section
 * 
 * Safeguarding staff should use the mobile app for day-to-day work.
 * Admin section is for org-level reporting and oversight only.
 */
export function canAccessSafeguardingAdmin(role: AdminRoleInfo): boolean {
  // Only org admins can view the admin-level safeguarding dashboard
  // Safeguarding staff (mobile app users) should NOT see this section
  return role.isOrgAdmin || role.isOrgOwner;
}

/**
 * Access requirement types for nav items
 */
export type AccessRequirement =
  | "none" // Always visible
  | "admin-only" // Org/site admins only
  | "billing" // Billing access
  | "safeguarding-admin" // Safeguarding admin overview
  | "staff-or-admin"; // Any authenticated user

export type AccessContext = {
  /** When true, billing nav and purchase flows are hidden (master/internal org). */
  currentOrgIsMasterOrg?: boolean;
};

/**
 * Check if user meets an access requirement
 */
export function meetsAccessRequirement(
  role: AdminRoleInfo,
  requirement: AccessRequirement | undefined,
  context?: AccessContext,
): boolean {
  if (!requirement || requirement === "none" || requirement === "staff-or-admin") {
    return true;
  }

  switch (requirement) {
    case "admin-only":
      return canAccessAdminSection(role);
    case "billing":
      return canAccessBilling(role) && !(context?.currentOrgIsMasterOrg ?? false);
    case "safeguarding-admin":
      return canAccessSafeguardingAdmin(role);
    default:
      return true;
  }
}

