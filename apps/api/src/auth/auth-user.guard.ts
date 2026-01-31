import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { parseAuthTokenFromRequest } from "./auth-token.util";
import { prisma } from "@pathway/db";
import type { Request, Response } from "express";

interface AuthenticatedRequest extends Request {
  authUserId?: string;
  authEmail?: string;
  authDisplayName?: string;
  [key: string]: unknown;
}

/**
 * Guard that:
 * 1. Authenticates user via Auth0 JWT (looks up UserIdentity)
 * 2. Resolves active tenant from cookie or User.lastActiveTenantId
 * 3. Sets up full PathwayRequestContext with tenant/org for RLS
 */
@Injectable()
export class AuthUserGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const res = context.switchToHttp().getResponse<Response>();

    const claims = parseAuthTokenFromRequest(req);
    
    // Extract Auth0 subject
    const auth0Sub = claims.sub;
    if (!auth0Sub) {
      throw new UnauthorizedException("Missing subject claim");
    }

    // Look up user by Auth0 identity
    const identity = await prisma.userIdentity.findUnique({
      where: {
        provider_providerSubject: {
          provider: "auth0",
          providerSubject: auth0Sub,
        },
      },
      include: {
        user: {
          include: {
            siteMemberships: {
              include: {
                tenant: {
                  include: { org: true },
                },
              },
            },
            orgMemberships: { include: { org: true } },
            orgRoles: { include: { org: true } },
          },
        },
      },
    });

    if (!identity?.user) {
      console.log("[AuthUserGuard] ❌ User not found for Auth0 subject:", auth0Sub);
      throw new UnauthorizedException("User not found for this Auth0 identity");
    }

    const user = identity.user;

    // Store user info on request for downstream use
    req.authUserId = user.id;
    req.authEmail = user.email ?? identity.email ?? undefined;
    req.authDisplayName = user.displayName ?? user.name ?? undefined;

    // Determine active tenant from cookie or user's lastActiveTenantId
    const cookieTenantId = req.cookies?.pw_active_site_id;
    const activeTenantId = cookieTenantId || user.lastActiveTenantId;

    let tenantId = "";
    let orgId = "";
    let orgSlug = "";

    // If we have an active tenant, validate and populate context
    if (activeTenantId) {
      const membership = user.siteMemberships.find(
        (m) => m.tenantId === activeTenantId,
      );

      if (membership) {
        tenantId = membership.tenantId;
        orgId = membership.tenant.orgId;
        orgSlug = membership.tenant.org.slug;

        // Sync cookie with DB if they differ
        if (!cookieTenantId || cookieTenantId !== activeTenantId) {
          res.cookie("pw_active_site_id", activeTenantId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          });
          res.cookie("pw_active_org_id", orgId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 30 * 24 * 60 * 60 * 1000,
          });
        }
      }
    }

    // Fallback 1: if no active tenant (e.g. cookie missing or first request), use first site so org-scoped endpoints (e.g. billing purchase) work
    if (!tenantId && user.siteMemberships.length > 0) {
      const first = user.siteMemberships[0];
      tenantId = first.tenantId;
      orgId = first.tenant.orgId;
      orgSlug = first.tenant.org.slug ?? "";
    }

    // Fallback 2: if still no org (e.g. user has org role but no site membership), use first org membership
    if (!orgId && user.orgMemberships.length > 0) {
      const first = user.orgMemberships[0];
      orgId = first.orgId;
      orgSlug = first.org?.slug ?? "";
    }
    if (!orgId && user.orgRoles.length > 0) {
      const first = user.orgRoles[0];
      orgId = first.orgId;
      orgSlug = first.org?.slug ?? "";
    }

    // Map new role system to old role system for backwards compatibility
    // OLD system uses enum values like "org:admin", "tenant:admin"
    const orgRoles = new Set<string>();
    const tenantRoles = new Set<string>();

    // Map OrgMembership roles to old UserOrgRole enum values
    user.orgMemberships.forEach((om) => {
      if (orgId && om.orgId !== orgId) return; // Only include roles for current org
      if (om.role === "ORG_ADMIN") orgRoles.add("org:admin"); // Match UserOrgRole.ORG_ADMIN
      if (om.role === "ORG_BILLING") orgRoles.add("org:billing_manager"); // Match UserOrgRole.BILLING_MANAGER
      if (om.role === "ORG_MEMBER") orgRoles.add("org:support"); // Generic member role
    });
    user.orgRoles.forEach((or) => {
      if (orgId && or.orgId !== orgId) return; // Only include roles for current org
      if (or.role === "ORG_ADMIN") orgRoles.add("org:admin");
      if (or.role === "ORG_BILLING") orgRoles.add("org:billing_manager");
      if (or.role === "ORG_MEMBER") orgRoles.add("org:support");
    });

    // Map SiteMembership roles to old UserTenantRole enum values
    user.siteMemberships.forEach((sm) => {
      if (tenantId && sm.tenantId !== tenantId) return; // Only include roles for current site
      if (sm.role === "SITE_ADMIN") tenantRoles.add("tenant:admin"); // Match UserTenantRole.ADMIN
      if (sm.role === "STAFF") tenantRoles.add("tenant:staff"); // Match UserTenantRole.STAFF
      if (sm.role === "VIEWER") tenantRoles.add("tenant:staff"); // VIEWER can also act as STAFF for read access
    });

    // Set up PathwayRequestContext for RLS interceptor and downstream services
    const pathwayContext = {
      user: {
        userId: user.id,
        email: user.email ?? identity.email ?? undefined,
        givenName: user.displayName ?? user.name ?? undefined,
        familyName: undefined,
        pictureUrl: undefined,
        authProvider: "auth0",
      },
      org: {
        orgId: orgId || "",
        orgSlug: orgSlug || undefined,
      },
      tenant: {
        tenantId: tenantId || "",
        orgId: orgId || "",
      },
      roles: { org: Array.from(orgRoles), tenant: Array.from(tenantRoles) },
      permissions: [],
      rawClaims: claims as Record<string, unknown>,
    };

    (req as Record<string, unknown>).__pathwayContext = pathwayContext;

    return true;
  }
}


