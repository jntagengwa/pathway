var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, UnauthorizedException, } from "@nestjs/common";
import { parseAuthTokenFromRequest } from "./auth-token.util";
import { prisma } from "@pathway/db";
/**
 * Guard that:
 * 1. Authenticates user via Auth0 JWT (looks up UserIdentity)
 * 2. Resolves active tenant from cookie or User.lastActiveTenantId
 * 3. Sets up full PathwayRequestContext with tenant/org for RLS
 */
let AuthUserGuard = class AuthUserGuard {
    async canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();
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
                        orgMemberships: true,
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
            const membership = user.siteMemberships.find((m) => m.tenantId === activeTenantId);
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
        // Map new role system to old role system for backwards compatibility
        // OLD system uses enum values like "org:admin", "tenant:admin"
        const orgRoles = [];
        const tenantRoles = [];
        // Map OrgMembership roles to old UserOrgRole enum values
        user.orgMemberships.forEach((om) => {
            if (orgId && om.orgId !== orgId)
                return; // Only include roles for current org
            if (om.role === "ORG_ADMIN")
                orgRoles.push("org:admin"); // Match UserOrgRole.ORG_ADMIN
            if (om.role === "ORG_BILLING")
                orgRoles.push("org:billing_manager"); // Match UserOrgRole.BILLING_MANAGER
            if (om.role === "ORG_MEMBER")
                orgRoles.push("org:support"); // Generic member role
        });
        // Map SiteMembership roles to old UserTenantRole enum values
        user.siteMemberships.forEach((sm) => {
            if (tenantId && sm.tenantId !== tenantId)
                return; // Only include roles for current site
            if (sm.role === "SITE_ADMIN")
                tenantRoles.push("tenant:admin"); // Match UserTenantRole.ADMIN
            if (sm.role === "STAFF")
                tenantRoles.push("tenant:staff"); // Match UserTenantRole.STAFF
            if (sm.role === "VIEWER")
                tenantRoles.push("tenant:staff"); // VIEWER can also act as STAFF for read access
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
            roles: { org: orgRoles, tenant: tenantRoles },
            permissions: [],
            rawClaims: claims,
        };
        req.__pathwayContext = pathwayContext;
        return true;
    }
};
AuthUserGuard = __decorate([
    Injectable()
], AuthUserGuard);
export { AuthUserGuard };
