/**
 * Central permission gates for the admin app.
 * Single place for route and action gating; uses role from access.ts.
 */

import type { AdminRoleInfo } from "./access";
import {
  canAccessAdminSection,
  canAccessBilling,
  canAccessSafeguardingAdmin,
} from "./access";

/** Paths restricted to ORG_ADMIN or SITE_ADMIN (admin-only). */
const ADMIN_ONLY_PATHS = [
  "/settings",
  "/reports",
  "/people/invite",
  "/classes/new",
  "/sessions/new",
  "/sessions/bulk-new",
];
const ADMIN_ONLY_PREFIXES = ["/settings", "/reports", "/people/invite"];

/** Paths restricted to ORG_ADMIN only (billing). */
const BILLING_PATHS = ["/billing"];
const BILLING_PREFIXES = ["/billing"];

/** Paths restricted to safeguarding admin (ORG_ADMIN, SITE_ADMIN, SAFEGUARDING_LEAD). */
const SAFEGUARDING_PATHS = ["/safeguarding"];
const SAFEGUARDING_PREFIXES = ["/safeguarding"];

/**
 * Check if the user can access the given pathname.
 * Staff can access: /, /sessions, /attendance, /people (list), /children, /parents, /lessons, /classes, /my-schedule, /notices.
 * Admin-only: /settings, /reports, /people/invite, classes/sessions create.
 * Billing: /billing (ORG_ADMIN only).
 * Safeguarding: /safeguarding and subpaths (ORG_ADMIN, SITE_ADMIN, SAFEGUARDING_LEAD).
 */
export function canAccessRoute(
  pathname: string,
  role: AdminRoleInfo,
): boolean {
  const path = pathname.replace(/\/$/, "") || "/";

  if (BILLING_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) {
    return canAccessBilling(role);
  }
  if (
    SAFEGUARDING_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))
  ) {
    return canAccessSafeguardingAdmin(role);
  }
  if (
    ADMIN_ONLY_PATHS.some((p) => path === p) ||
    ADMIN_ONLY_PREFIXES.some((p) => path.startsWith(p + "/"))
  ) {
    return canAccessAdminSection(role);
  }
  if (path === "/people" || path.startsWith("/people/")) {
    if (path === "/people/invite" || path.startsWith("/people/invite/")) {
      return canAccessAdminSection(role);
    }
    return true; // list and detail viewable by staff (edit gated by canPerform)
  }

  return true;
}

export type AdminAction =
  | "people:invite"
  | "people:edit"
  | "sessions:create"
  | "sessions:edit"
  | "sessions:bulk-create"
  | "classes:create"
  | "classes:edit"
  | "settings:access"
  | "settings:edit-org"
  | "settings:edit-site"
  | "reports:access"
  | "billing:access"
  | "safeguarding:access";

/**
 * Check if the user can perform the given action.
 * Use for hiding or disabling buttons (invite, edit, create, etc.).
 */
export function canPerform(
  action: AdminAction,
  role: AdminRoleInfo,
): boolean {
  switch (action) {
    case "people:invite":
    case "people:edit":
      return canAccessAdminSection(role);
    case "sessions:create":
    case "sessions:edit":
    case "sessions:bulk-create":
    case "classes:create":
    case "classes:edit":
    case "settings:access":
    case "reports:access":
      return canAccessAdminSection(role);
    case "settings:edit-org":
      return canAccessBilling(role);
    case "settings:edit-site":
      return canAccessAdminSection(role);
    case "billing:access":
      return canAccessBilling(role);
    case "safeguarding:access":
      return canAccessSafeguardingAdmin(role);
    default:
      return false;
  }
}
