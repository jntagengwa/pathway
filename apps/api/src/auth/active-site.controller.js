var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Body, Controller, Get, Post, Req, Res, UnauthorizedException, UseGuards, } from "@nestjs/common";
import { prisma, OrgRole, SiteRole, Role } from "@pathway/db";
import { AuthUserGuard } from "./auth-user.guard";
const ACTIVE_SITE_COOKIE = "pw_active_site_id";
const ACTIVE_ORG_COOKIE = "pw_active_org_id";
const ORG_ADMIN_ROLES = [OrgRole.ORG_ADMIN, OrgRole.ORG_BILLING];
let ActiveSiteController = class ActiveSiteController {
    async getActiveSite(req) {
        const userId = req.authUserId;
        if (!userId) {
            throw new UnauthorizedException("Missing authenticated user");
        }
        // Get user's accessible sites
        const sites = await this.listSitesForUser(userId);
        // Get user's last active tenant
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { lastActiveTenantId: true },
        });
        let activeSiteId = sites.find((site) => site.id === user?.lastActiveTenantId)?.id;
        // Auto-select if only one site
        if (!activeSiteId && sites.length === 1) {
            activeSiteId = sites[0]?.id ?? null;
            if (activeSiteId) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { lastActiveTenantId: activeSiteId },
                });
            }
        }
        return { activeSiteId: activeSiteId ?? null, sites };
    }
    async listSitesForUser(userId) {
        const directMemberships = await prisma.siteMembership.findMany({
            where: { userId },
            include: {
                tenant: {
                    include: { org: true },
                },
            },
        });
        const orgMemberships = await prisma.orgMembership.findMany({
            where: { userId, role: { in: ORG_ADMIN_ROLES } },
        });
        const orgTenantIds = orgMemberships.length > 0
            ? await prisma.tenant.findMany({
                where: { orgId: { in: orgMemberships.map((m) => m.orgId) } },
                include: { org: true },
            })
            : [];
        const combined = [
            ...directMemberships.map((m) => ({
                id: m.tenantId,
                name: m.tenant.name,
                orgId: m.tenant.orgId,
                orgName: m.tenant.org.name,
                orgSlug: m.tenant.org.slug,
                role: m.role,
            })),
            ...orgTenantIds.map((tenant) => ({
                id: tenant.id,
                name: tenant.name,
                orgId: tenant.orgId,
                orgName: tenant.org.name,
                orgSlug: tenant.org.slug,
                role: SiteRole.SITE_ADMIN,
            })),
        ];
        // De-dupe by tenantId
        const seen = new Map();
        combined.forEach((site) => {
            if (!seen.has(site.id)) {
                seen.set(site.id, site);
            }
        });
        return Array.from(seen.values()).sort((a, b) => (a.orgName ?? "").localeCompare(b.orgName ?? "") ||
            a.name.localeCompare(b.name));
    }
    async setActiveSite(req, body, res) {
        const userId = req.authUserId;
        if (!userId) {
            throw new UnauthorizedException("Missing authenticated user");
        }
        if (!body?.siteId) {
            throw new UnauthorizedException("siteId is required");
        }
        const sites = await this.listSitesForUser(userId);
        const hasAccess = sites.some((site) => site.id === body.siteId);
        if (!hasAccess) {
            throw new UnauthorizedException("Site not accessible for this user");
        }
        await prisma.user.update({
            where: { id: userId },
            data: { lastActiveTenantId: body.siteId },
        });
        const result = { activeSiteId: body.siteId, sites };
        const selectedSite = sites.find((s) => s.id === body.siteId);
        this.setActiveSiteCookies(res, {
            siteId: body.siteId,
            orgId: selectedSite?.orgId ?? null,
        });
        return result;
    }
    async getUserRoles(req) {
        const userId = req.authUserId;
        if (!userId) {
            throw new UnauthorizedException("Missing authenticated user");
        }
        // Get user's org memberships to determine org roles
        const orgMemberships = await prisma.orgMembership.findMany({
            where: { userId },
            include: { org: { select: { id: true, name: true } } },
        });
        // Get user's site memberships to determine site roles
        const siteMemberships = await prisma.siteMembership.findMany({
            where: { userId },
            include: { tenant: { select: { id: true, name: true, orgId: true } } },
        });
        // Also check legacy UserOrgRole and UserTenantRole tables for backward compatibility
        const userOrgRoles = await prisma.userOrgRole.findMany({
            where: { userId },
            include: { org: { select: { id: true, name: true } } },
        });
        const userTenantRoles = await prisma.userTenantRole.findMany({
            where: { userId },
            include: { tenant: { select: { id: true, name: true, orgId: true } } },
        });
        // Combine org roles from both sources
        const orgRoles = new Map();
        orgMemberships.forEach((m) => {
            orgRoles.set(m.orgId, m.role);
        });
        userOrgRoles.forEach((r) => {
            // Only set if not already present (memberships take precedence)
            if (!orgRoles.has(r.orgId)) {
                orgRoles.set(r.orgId, r.role);
            }
        });
        // Combine site roles from both sources
        const siteRoles = new Map();
        siteMemberships.forEach((m) => {
            siteRoles.set(m.tenantId, m.role);
        });
        userTenantRoles.forEach((r) => {
            // Map legacy Role enum to SiteRole
            const mappedRole = this.mapRoleToSiteRole(r.role);
            if (mappedRole && !siteRoles.has(r.tenantId)) {
                siteRoles.set(r.tenantId, mappedRole);
            }
        });
        return {
            userId,
            orgRoles: Array.from(orgRoles.entries()).map(([orgId, role]) => ({
                orgId,
                role,
            })),
            siteRoles: Array.from(siteRoles.entries()).map(([tenantId, role]) => ({
                tenantId,
                role,
            })),
            // Include full membership details for convenience
            orgMemberships: orgMemberships.map((m) => ({
                orgId: m.orgId,
                orgName: m.org.name,
                role: m.role,
            })),
            siteMemberships: siteMemberships.map((m) => ({
                tenantId: m.tenantId,
                tenantName: m.tenant.name,
                orgId: m.tenant.orgId,
                role: m.role,
            })),
        };
    }
    /**
     * Map legacy Role enum to SiteRole enum
     */
    mapRoleToSiteRole(role) {
        switch (role) {
            case Role.ADMIN:
                return SiteRole.SITE_ADMIN;
            case Role.TEACHER:
            case Role.COORDINATOR:
                return SiteRole.STAFF;
            case Role.PARENT:
                return SiteRole.VIEWER;
            default:
                return null;
        }
    }
    setActiveSiteCookies(res, payload) {
        const secure = process.env.NODE_ENV === "production";
        const options = {
            httpOnly: true,
            sameSite: "lax",
            secure,
            path: "/",
            maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        };
        res.cookie(ACTIVE_SITE_COOKIE, payload.siteId ?? "", options);
        res.cookie(ACTIVE_ORG_COOKIE, payload.orgId ?? "", options);
    }
};
__decorate([
    UseGuards(AuthUserGuard),
    Get(),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ActiveSiteController.prototype, "getActiveSite", null);
__decorate([
    UseGuards(AuthUserGuard),
    Post(),
    __param(0, Req()),
    __param(1, Body()),
    __param(2, Res({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], ActiveSiteController.prototype, "setActiveSite", null);
__decorate([
    UseGuards(AuthUserGuard),
    Get("roles"),
    __param(0, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ActiveSiteController.prototype, "getUserRoles", null);
ActiveSiteController = __decorate([
    Controller("auth/active-site")
], ActiveSiteController);
export { ActiveSiteController };
