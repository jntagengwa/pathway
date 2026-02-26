import type { Request } from "express";
import { ForbiddenException } from "@nestjs/common";

export interface HandoverAuthenticatedRequest extends Request {
  authUserId?: string;
  __pathwayContext?: {
    tenant?: { tenantId?: string; orgId?: string };
    org?: { orgId?: string };
    siteRole?: string | null;
    roles?: { org?: string[]; tenant?: string[] };
  };
}

export type HandoverAdminContext = {
  tenant?: { tenantId?: string; orgId?: string };
  org?: { orgId?: string };
  siteRole?: string | null;
  roles?: { org?: string[]; tenant?: string[] };
};

export function getAuthUserId(req: HandoverAuthenticatedRequest): string {
  const userId = req.authUserId;
  if (!userId) {
    throw new ForbiddenException("Authentication required");
  }
  return userId;
}

export function isTenantAdmin(
  ctxOrReq: HandoverAdminContext | HandoverAuthenticatedRequest | undefined,
): boolean {
  if (!ctxOrReq) return false;

  const ctx =
    "__pathwayContext" in (ctxOrReq as HandoverAuthenticatedRequest)
      ? ((ctxOrReq as HandoverAuthenticatedRequest)
          .__pathwayContext as HandoverAdminContext)
      : (ctxOrReq as HandoverAdminContext);
  if (!ctx) return false;

  if (ctx.siteRole === "SITE_ADMIN") {
    return true;
  }

  const tenantRoles = ctx.roles?.tenant ?? [];
  return tenantRoles.includes("tenant:admin");
}

export function assertTenantAdmin(req: HandoverAuthenticatedRequest): void {
  // Ensure the request is authenticated first
  getAuthUserId(req);
  if (!isTenantAdmin(req)) {
    throw new ForbiddenException(
      "You must be a site admin for this site or an org admin to manage handover logs",
    );
  }
}

