/**
 * React hook for admin access control
 * 
 * Fetches user roles from the API (queries UserOrgRole, UserTenantRole, OrgMembership, SiteMembership tables)
 * and provides role information and loading state.
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  type AdminRoleInfo,
  getAdminRoleInfoFromApiResponse,
} from "./access";
import { fetchUserRoles, type UserRolesResponse } from "./api-client";

export type UseAdminAccessResult = {
  role: AdminRoleInfo;
  /** True when current org is a master/internal org (no billing, unlimited). */
  currentOrgIsMasterOrg: boolean;
  isLoading: boolean;
  error?: string | null;
};

/**
 * Hook to get admin role information from the API
 * 
 * Queries the database via /auth/active-site/roles endpoint to check:
 * - UserOrgRole table (org-level roles)
 * - UserTenantRole table (site-level roles)  
 * - OrgMembership table (org-level memberships)
 * - SiteMembership table (site-level memberships)
 * 
 * Usage:
 * ```tsx
 * const { role, isLoading } = useAdminAccess();
 * 
 * if (isLoading) return <LoadingSpinner />;
 * if (!canAccessBilling(role)) return <NoAccessCard />;
 * ```
 */
export function useAdminAccess(): UseAdminAccessResult {
  const { data: session, status: sessionStatus } = useSession();
  const [rolesResponse, setRolesResponse] = useState<UserRolesResponse | null>(null);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch roles when session is authenticated
    if (sessionStatus !== "authenticated" || !session) {
      setIsLoadingRoles(false);
      return;
    }

    let cancelled = false;

    async function loadRoles() {
      try {
        setIsLoadingRoles(true);
        setError(null);
        const response = await fetchUserRoles();
        if (!cancelled) {
          setRolesResponse(response);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load user roles",
          );
          setRolesResponse(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRoles(false);
        }
      }
    }

    void loadRoles();

    return () => {
      cancelled = true;
    };
  }, [sessionStatus, session]);

  const role = useMemo(
    () => getAdminRoleInfoFromApiResponse(rolesResponse),
    [rolesResponse],
  );

  const currentOrgIsMasterOrg = rolesResponse?.currentOrgIsMasterOrg ?? false;
  const isLoading = sessionStatus === "loading" || isLoadingRoles;

  return {
    role,
    currentOrgIsMasterOrg,
    isLoading,
    error,
  };
}

