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
import { BadRequestException, Body, Controller, Get, Param, Post, UseGuards, Req, UnauthorizedException, Inject, InternalServerErrorException, } from "@nestjs/common";
import { z } from "zod";
import { OrgsService } from "./orgs.service";
import { registerOrgDto } from "./dto/register-org.dto";
import { CurrentOrg } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { OrgRole, prisma } from "@pathway/db";
const parseOrBadRequest = async (schema, data) => {
    try {
        return await schema.parseAsync(data);
    }
    catch (e) {
        if (e instanceof z.ZodError) {
            throw new BadRequestException(e.flatten());
        }
        throw e;
    }
};
const slugParam = z
    .object({
    slug: z.string().min(1, "slug is required"),
})
    .strict();
let OrgsController = class OrgsController {
    service;
    constructor(service) {
        this.service = service;
    }
    /**
     * Registers a new organisation (and optional first tenant), optionally bootstrapping billing.
     * Accepts the DTO defined in register-org.dto. Returns created org, initial tenant (if any),
     * and admin/billing outcomes.
     */
    async register(body) {
        const dto = await parseOrBadRequest(registerOrgDto, body);
        return this.service.register(dto);
    }
    /**
     * List organisations (MVP: no filters).
     */
    async list(orgId) {
        return this.service.list(orgId);
    }
    /**
     * Fetch an organisation by slug.
     */
    async getBySlug(params, orgId) {
        const { slug } = await parseOrBadRequest(slugParam, params);
        return this.service.getBySlug(slug, orgId);
    }
    /**
     * List people (users) with access to an organisation.
     * Returns users with their org role and site access summary.
     * Requires Org ADMIN access.
     */
    async listPeople(orgId, req) {
        try {
            const userId = req.authUserId;
            if (!userId) {
                throw new UnauthorizedException("User ID not found in request");
            }
            // Check if user has ADMIN access to this org
            const membership = await prisma.orgMembership.findFirst({
                where: {
                    userId,
                    orgId,
                    role: { in: [OrgRole.ORG_ADMIN] },
                },
            });
            if (!membership) {
                throw new UnauthorizedException("You must be an Org Admin to view people");
            }
            // Fetch all users with org or site memberships for this org
            const orgMembers = await prisma.orgMembership.findMany({
                where: { orgId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            displayName: true,
                            email: true,
                        },
                    },
                },
            });
            // Filter out any memberships where user is null (shouldn't happen, but be defensive)
            const validMembers = orgMembers.filter((m) => m.user !== null);
            // Get site memberships for users in this org
            const orgSites = await prisma.tenant.findMany({
                where: { orgId },
                select: { id: true },
            });
            const siteIds = orgSites.map((s) => s.id);
            const siteMembers = await prisma.siteMembership.findMany({
                where: {
                    tenantId: { in: siteIds },
                },
                select: {
                    userId: true,
                    tenantId: true,
                },
            });
            // Build map of userId -> siteCount
            const siteCountMap = new Map();
            for (const sm of siteMembers) {
                siteCountMap.set(sm.userId, (siteCountMap.get(sm.userId) || 0) + 1);
            }
            // Build response
            const people = validMembers.map((m) => {
                try {
                    // At this point, we know m.user is not null due to filter above
                    const user = m.user;
                    const siteCount = siteCountMap.get(user.id) || 0;
                    const allSites = m.role === OrgRole.ORG_ADMIN; // Admins have implicit access
                    // Use safe display name logic: prefer displayName if not email, else name, else generic
                    const rawDisplayName = user.displayName ?? null;
                    const rawName = user.name ?? null;
                    const rawEmail = user.email ?? null;
                    const displayName = rawDisplayName && typeof rawDisplayName === "string" ? rawDisplayName.trim() : null;
                    const name = rawName && typeof rawName === "string" ? rawName.trim() : null;
                    const email = rawEmail && typeof rawEmail === "string" ? rawEmail.trim() : null;
                    // Check if a value looks like an email address
                    const isEmailValue = (val) => {
                        if (!val || typeof val !== "string" || val.length === 0)
                            return false;
                        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
                    };
                    // Determine safe display name with fallback logic
                    let safeDisplayName;
                    if (displayName && displayName.length > 0 && !isEmailValue(displayName)) {
                        safeDisplayName = displayName;
                    }
                    else if (name && name.length > 0) {
                        safeDisplayName = name;
                    }
                    else if (email) {
                        safeDisplayName = "User";
                    }
                    else {
                        safeDisplayName = "Unknown";
                    }
                    return {
                        id: user.id,
                        name: safeDisplayName,
                        displayName: rawDisplayName,
                        email: email || "",
                        orgRole: m.role,
                        siteAccessSummary: {
                            allSites,
                            siteCount,
                        },
                    };
                }
                catch (error) {
                    console.error("[ORGS] Error mapping person:", error, m);
                    // Return a safe fallback
                    const user = m.user;
                    return {
                        id: user?.id ?? "",
                        name: "Unknown",
                        displayName: null,
                        email: user?.email ?? "",
                        orgRole: m.role,
                        siteAccessSummary: {
                            allSites: false,
                            siteCount: 0,
                        },
                    };
                }
            });
            return people;
        }
        catch (error) {
            console.error("[ORGS] listPeople error:", error instanceof Error ? error.message : String(error));
            // Re-throw known exceptions, wrap unknown ones
            if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
                throw error;
            }
            // Check if it's a Prisma error
            if (error && typeof error === "object" && "code" in error) {
                const prismaError = error;
                console.error("[ORGS] Prisma error code:", prismaError.code);
                throw new InternalServerErrorException(`Database error: ${prismaError.message || "Unknown Prisma error"}`);
            }
            throw new InternalServerErrorException(`Failed to list people: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
};
__decorate([
    Post("register"),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrgsController.prototype, "register", null);
__decorate([
    Get(),
    UseGuards(AuthUserGuard),
    __param(0, CurrentOrg("orgId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrgsController.prototype, "list", null);
__decorate([
    Get(":slug"),
    UseGuards(AuthUserGuard),
    __param(0, Param()),
    __param(1, CurrentOrg("orgId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OrgsController.prototype, "getBySlug", null);
__decorate([
    Get(":orgId/people"),
    UseGuards(AuthUserGuard),
    __param(0, Param("orgId")),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrgsController.prototype, "listPeople", null);
OrgsController = __decorate([
    Controller("orgs"),
    __param(0, Inject(OrgsService)),
    __metadata("design:paramtypes", [OrgsService])
], OrgsController);
export { OrgsController };
