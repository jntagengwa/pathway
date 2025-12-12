import type { UserOrgRole, UserTenantRole } from "@pathway/auth";

export interface SafeguardingRoleRequirement {
  tenantRoles?: UserTenantRole[];
  orgRoles?: UserOrgRole[];
  description?: string;
}

export interface SafeguardingContextIds {
  tenantId: string;
  orgId: string;
  actorUserId: string;
}

