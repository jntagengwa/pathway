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
import { Controller, Post, Get, Body, Param, Query, UseGuards, Req, UnauthorizedException, Inject, } from "@nestjs/common";
import { InvitesService } from "./invites.service";
import { CreateInviteDto } from "./dto/create-invite.dto";
import { AcceptInviteDto } from "./dto/accept-invite.dto";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { OrgRole, prisma } from "@pathway/db";
let InvitesController = class InvitesController {
    invitesService;
    constructor(invitesService) {
        this.invitesService = invitesService;
    }
    /**
     * Create a new invite (Org OWNER/ADMIN only)
     */
    async createInvite(orgId, dto, req) {
        const userId = req.authUserId;
        // Check if user has OWNER or ADMIN role for this org
        await this.requireOrgAdminAccess(userId, orgId);
        return this.invitesService.createInvite(orgId, userId, dto);
    }
    /**
     * Resend an invite (Org OWNER/ADMIN only)
     */
    async resendInvite(orgId, inviteId, req) {
        const userId = req.authUserId;
        await this.requireOrgAdminAccess(userId, orgId);
        return this.invitesService.resendInvite(orgId, inviteId);
    }
    /**
     * Revoke an invite (Org OWNER/ADMIN only)
     */
    async revokeInvite(orgId, inviteId, req) {
        const userId = req.authUserId;
        await this.requireOrgAdminAccess(userId, orgId);
        return this.invitesService.revokeInvite(orgId, inviteId);
    }
    /**
     * List invites for an org (Org OWNER/ADMIN only)
     */
    async listInvites(orgId, status, req) {
        const userId = req?.authUserId;
        await this.requireOrgAdminAccess(userId, orgId);
        return this.invitesService.listInvites(orgId, status);
    }
    /**
     * Accept an invite (authenticated user only)
     */
    async acceptInvite(dto, req) {
        const userId = req.authUserId;
        // Get user email from DB
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });
        if (!user?.email) {
            throw new UnauthorizedException("User email not found");
        }
        return this.invitesService.acceptInvite(dto.token, userId, user.email);
    }
    /**
     * Helper: Check if user has Org ADMIN or OWNER access
     */
    async requireOrgAdminAccess(userId, orgId) {
        const membership = await prisma.orgMembership.findFirst({
            where: {
                userId,
                orgId,
                role: { in: [OrgRole.ORG_ADMIN] },
            },
        });
        if (!membership) {
            throw new UnauthorizedException("You must be an Org Admin to manage invites");
        }
    }
};
__decorate([
    UseGuards(AuthUserGuard),
    Post("orgs/:orgId/invites"),
    __param(0, Param("orgId")),
    __param(1, Body()),
    __param(2, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateInviteDto, Object]),
    __metadata("design:returntype", Promise)
], InvitesController.prototype, "createInvite", null);
__decorate([
    UseGuards(AuthUserGuard),
    Post("orgs/:orgId/invites/:inviteId/resend"),
    __param(0, Param("orgId")),
    __param(1, Param("inviteId")),
    __param(2, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], InvitesController.prototype, "resendInvite", null);
__decorate([
    UseGuards(AuthUserGuard),
    Post("orgs/:orgId/invites/:inviteId/revoke"),
    __param(0, Param("orgId")),
    __param(1, Param("inviteId")),
    __param(2, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], InvitesController.prototype, "revokeInvite", null);
__decorate([
    UseGuards(AuthUserGuard),
    Get("orgs/:orgId/invites"),
    __param(0, Param("orgId")),
    __param(1, Query("status")),
    __param(2, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], InvitesController.prototype, "listInvites", null);
__decorate([
    UseGuards(AuthUserGuard),
    Post("invites/accept"),
    __param(0, Body()),
    __param(1, Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [AcceptInviteDto, Object]),
    __metadata("design:returntype", Promise)
], InvitesController.prototype, "acceptInvite", null);
InvitesController = __decorate([
    Controller(),
    __param(0, Inject(InvitesService)),
    __metadata("design:paramtypes", [InvitesService])
], InvitesController);
export { InvitesController };
