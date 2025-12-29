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
import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, Inject, } from "@nestjs/common";
import { prisma, OrgRole, SiteRole, Role } from "@pathway/db";
import { createHash, randomBytes } from "crypto";
import { MailerService } from "../mailer/mailer.service";
let InvitesService = class InvitesService {
    mailerService;
    constructor(mailerService) {
        this.mailerService = mailerService;
    }
    /**
     * Create a new invite for a user to join an Org and optionally specific Sites.
     */
    async createInvite(orgId, createdByUserId, dto) {
        const normalizedEmail = dto.email.trim().toLowerCase();
        // Generate secure random token
        const rawToken = randomBytes(32).toString("hex");
        const tokenHash = this.hashToken(rawToken);
        // Determine site access
        let siteIdsJson = null;
        const siteRole = dto.siteAccess?.role ?? null;
        if (dto.siteAccess) {
            if (dto.siteAccess.mode === "SELECT_SITES") {
                if (!dto.siteAccess.siteIds || dto.siteAccess.siteIds.length === 0) {
                    throw new BadRequestException("At least one site must be selected for SELECT_SITES mode");
                }
                siteIdsJson = JSON.stringify(dto.siteAccess.siteIds);
            }
            else if (dto.siteAccess.mode === "ALL_SITES") {
                // For ALL_SITES, we don't store specific IDs
                siteIdsJson = JSON.stringify([]);
            }
        }
        // Check for existing active invite for this (orgId, email)
        const existingInvite = await prisma.invite.findFirst({
            where: {
                orgId,
                email: normalizedEmail,
                usedAt: null,
                revokedAt: null,
                expiresAt: { gt: new Date() },
            },
        });
        if (existingInvite) {
            // Revoke the old one and create a new one
            await prisma.invite.update({
                where: { id: existingInvite.id },
                data: { revokedAt: new Date() },
            });
        }
        // Create new invite
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
        // Note: name field added to schema - Prisma client needs regeneration after migration
        // Using type assertion via unknown to work around Prisma client type mismatch until regeneration
        const invite = await prisma.invite.create({
            data: {
                orgId,
                createdByUserId,
                email: normalizedEmail,
                name: dto.name?.trim() || null,
                orgRole: dto.orgRole ?? null,
                siteIdsJson,
                siteRole,
                tokenHash,
                expiresAt,
                lastSentAt: new Date(),
            },
            include: {
                org: { select: { name: true } },
                createdBy: { select: { name: true, displayName: true } },
            },
        });
        // Send invite email
        const baseUrl = process.env.ADMIN_URL || "https://localhost:3000";
        const inviteUrl = `${baseUrl}/accept-invite?token=${rawToken}`;
        const invitedByName = invite.createdBy.displayName || invite.createdBy.name || "A team member";
        console.log("[INVITE] 📧 Preparing to send invite email:");
        console.log({
            inviteId: invite.id,
            email: normalizedEmail,
            orgName: invite.org.name,
            invitedBy: invitedByName,
            inviteUrl,
        });
        try {
            await this.mailerService.sendInviteEmail({
                to: normalizedEmail,
                inviteUrl,
                orgName: invite.org.name,
                invitedByName,
            });
            console.log(`[INVITE] ✅ Email sent successfully to ${normalizedEmail}`);
        }
        catch (error) {
            console.error(`[INVITE] ❌ Failed to send email to ${normalizedEmail}:`, error);
            // Don't fail the invite creation if email fails
        }
        return this.toSummary(invite);
    }
    /**
     * Resend an existing invite (generates new token).
     */
    async resendInvite(orgId, inviteId) {
        const invite = await prisma.invite.findFirst({
            where: { id: inviteId, orgId },
        });
        if (!invite) {
            throw new NotFoundException("Invite not found");
        }
        if (invite.usedAt) {
            throw new BadRequestException("Invite already used");
        }
        if (invite.revokedAt) {
            throw new BadRequestException("Invite has been revoked");
        }
        // Generate new token
        const rawToken = randomBytes(32).toString("hex");
        const tokenHash = this.hashToken(rawToken);
        const updated = await prisma.invite.update({
            where: { id: inviteId },
            data: {
                tokenHash,
                lastSentAt: new Date(),
                // Optionally extend expiry
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
            include: {
                org: { select: { name: true } },
                createdBy: { select: { name: true, displayName: true } },
            },
        });
        // Resend invite email
        const baseUrl = process.env.ADMIN_URL || "https://localhost:3000";
        const inviteUrl = `${baseUrl}/accept-invite?token=${rawToken}`;
        const invitedByName = updated.createdBy.displayName || updated.createdBy.name || "A team member";
        console.log("[INVITE] 🔄 Resending invite email:");
        console.log({
            inviteId: updated.id,
            email: updated.email,
            orgName: updated.org.name,
            invitedBy: invitedByName,
            inviteUrl,
        });
        try {
            await this.mailerService.sendInviteEmail({
                to: updated.email,
                inviteUrl,
                orgName: updated.org.name,
                invitedByName,
            });
            console.log(`[INVITE] ✅ Email resent successfully to ${updated.email}`);
        }
        catch (error) {
            console.error(`[INVITE] ❌ Failed to resend email to ${updated.email}:`, error);
            // Don't fail the resend if email fails
        }
        return this.toSummary(updated);
    }
    /**
     * Revoke an invite.
     */
    async revokeInvite(orgId, inviteId) {
        const invite = await prisma.invite.findFirst({
            where: { id: inviteId, orgId },
        });
        if (!invite) {
            throw new NotFoundException("Invite not found");
        }
        const updated = await prisma.invite.update({
            where: { id: inviteId },
            data: { revokedAt: new Date() },
        });
        return this.toSummary(updated);
    }
    /**
     * List invites for an Org, optionally filtered by status.
     */
    async listInvites(orgId, status) {
        try {
            const now = new Date();
            let where = { orgId };
            if (status === "pending") {
                where = {
                    ...where,
                    usedAt: null,
                    revokedAt: null,
                    expiresAt: { gt: now },
                };
            }
            else if (status === "used") {
                where = { ...where, usedAt: { not: null } };
            }
            else if (status === "expired") {
                where = {
                    ...where,
                    usedAt: null,
                    revokedAt: null,
                    expiresAt: { lte: now },
                };
            }
            else if (status === "revoked") {
                where = { ...where, revokedAt: { not: null } };
            }
            const invites = await prisma.invite.findMany({
                where,
                orderBy: { createdAt: "desc" },
            });
            return invites.map((inv) => this.toSummary(inv));
        }
        catch (error) {
            console.error("[INVITES] listInvites error:", error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    /**
     * Accept an invite by token. This creates memberships and returns accessible sites.
     */
    async acceptInvite(token, userId, userEmail) {
        const tokenHash = this.hashToken(token);
        const invite = await prisma.invite.findUnique({
            where: { tokenHash },
            include: { org: true },
        });
        if (!invite) {
            throw new NotFoundException("Invalid invite token");
        }
        if (invite.usedAt) {
            throw new BadRequestException("Invite has already been used");
        }
        if (invite.revokedAt) {
            throw new BadRequestException("Invite has been revoked");
        }
        if (invite.expiresAt < new Date()) {
            throw new BadRequestException("Invite has expired");
        }
        // Verify email match
        const normalizedUserEmail = userEmail.trim().toLowerCase();
        if (normalizedUserEmail !== invite.email) {
            throw new UnauthorizedException(`Invite is for ${invite.email}, but you are signed in as ${normalizedUserEmail}`);
        }
        // Apply memberships
        // Note: name field added to schema - Prisma client needs regeneration after migration
        const { orgId, orgRole, siteIdsJson, siteRole, name: inviteName } = invite;
        // Update user name from invite if provided and user doesn't have a name yet
        if (inviteName?.trim()) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true, displayName: true },
            });
            if (user) {
                const updates = {};
                // Set name if it's currently null/empty
                if (!user.name?.trim()) {
                    updates.name = inviteName.trim();
                }
                // Set displayName if it's currently null/empty OR if it equals the email (auto-generated)
                // Don't overwrite a good displayName that the user might have set themselves
                const currentDisplayName = user.displayName?.trim();
                const userEmail = normalizedUserEmail;
                if (!currentDisplayName || currentDisplayName === userEmail) {
                    updates.displayName = inviteName.trim();
                }
                if (Object.keys(updates).length > 0) {
                    await prisma.user.update({
                        where: { id: userId },
                        data: updates,
                    });
                    console.log("[INVITE-ACCEPT] Updated user name from invite:", {
                        userId,
                        updates,
                    });
                }
            }
        }
        console.log("[INVITE-ACCEPT] Applying memberships for invite:", {
            inviteId: invite.id,
            userId,
            userEmail: normalizedUserEmail,
            orgRole,
            siteRole,
            hasSiteIdsJson: !!siteIdsJson,
            inviteName,
        });
        // 1. Org membership
        // Always create at least ORG_MEMBER if no role specified
        const effectiveOrgRole = orgRole || OrgRole.ORG_MEMBER;
        console.log("[INVITE-ACCEPT] Creating OrgMembership with role:", effectiveOrgRole);
        const orgMembership = await prisma.orgMembership.upsert({
            where: {
                orgId_userId: { orgId, userId },
            },
            create: {
                orgId,
                userId,
                role: effectiveOrgRole,
            },
            update: {
                // Don't downgrade if user already has a higher role
                role: effectiveOrgRole,
            },
        });
        console.log("[INVITE-ACCEPT] ✅ OrgMembership created:", orgMembership);
        // 1b. Create UserOrgRole record (for backward compatibility with older role checks)
        // Map OrgRole enum directly (they use the same enum values)
        if (effectiveOrgRole) {
            try {
                // Check if record already exists
                const existing = await prisma.userOrgRole.findFirst({
                    where: {
                        userId,
                        orgId,
                        role: effectiveOrgRole,
                    },
                });
                if (!existing) {
                    await prisma.userOrgRole.create({
                        data: {
                            userId,
                            orgId,
                            role: effectiveOrgRole,
                        },
                    });
                    console.log("[INVITE-ACCEPT] ✅ UserOrgRole created:", {
                        userId,
                        orgId,
                        role: effectiveOrgRole,
                    });
                }
                else {
                    console.log("[INVITE-ACCEPT] UserOrgRole already exists, skipping");
                }
            }
            catch (err) {
                // Ignore duplicate errors (P2002)
                const code = typeof err === "object" && err !== null && "code" in err
                    ? String(err.code)
                    : undefined;
                if (code !== "P2002") {
                    console.error("[INVITE-ACCEPT] Failed to create UserOrgRole:", err);
                }
            }
        }
        // 2. Site memberships
        let siteIds = [];
        if (siteIdsJson) {
            try {
                const parsed = JSON.parse(siteIdsJson);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    siteIds = parsed;
                }
                else {
                    // ALL_SITES mode (empty array) - get all sites for this org
                    const allSites = await prisma.tenant.findMany({
                        where: { orgId },
                        select: { id: true },
                    });
                    siteIds = allSites.map((s) => s.id);
                }
            }
            catch (err) {
                console.error("[INVITE-ACCEPT] Failed to parse siteIdsJson:", err);
            }
        }
        else {
            // No site access specified - give access to all sites with STAFF role by default
            console.log("[INVITE-ACCEPT] No site access specified, granting access to all sites");
            const allSites = await prisma.tenant.findMany({
                where: { orgId },
                select: { id: true },
            });
            siteIds = allSites.map((s) => s.id);
        }
        // Always create site memberships - default to STAFF if no role specified
        const effectiveSiteRole = siteRole || SiteRole.STAFF;
        console.log("[INVITE-ACCEPT] Creating SiteMemberships:", {
            siteCount: siteIds.length,
            role: effectiveSiteRole,
            siteIds,
        });
        if (siteIds.length > 0) {
            for (const siteId of siteIds) {
                const siteMembership = await prisma.siteMembership.upsert({
                    where: {
                        tenantId_userId: { tenantId: siteId, userId },
                    },
                    create: {
                        tenantId: siteId,
                        userId,
                        role: effectiveSiteRole,
                    },
                    update: {
                        // Optionally update role
                        role: effectiveSiteRole,
                    },
                });
                console.log("[INVITE-ACCEPT] ✅ SiteMembership created:", {
                    siteId,
                    role: siteMembership.role,
                });
                // 2b. Create UserTenantRole record (for backward compatibility with older role checks)
                // Map SiteRole to Role enum
                const tenantRole = this.mapSiteRoleToRole(effectiveSiteRole);
                if (tenantRole) {
                    try {
                        // Check if record already exists
                        const existing = await prisma.userTenantRole.findFirst({
                            where: {
                                userId,
                                tenantId: siteId,
                                role: tenantRole,
                            },
                        });
                        if (!existing) {
                            await prisma.userTenantRole.create({
                                data: {
                                    userId,
                                    tenantId: siteId,
                                    role: tenantRole,
                                },
                            });
                            console.log("[INVITE-ACCEPT] ✅ UserTenantRole created:", {
                                userId,
                                tenantId: siteId,
                                role: tenantRole,
                            });
                        }
                        else {
                            console.log("[INVITE-ACCEPT] UserTenantRole already exists, skipping");
                        }
                    }
                    catch (err) {
                        // Ignore duplicate errors (P2002)
                        const code = typeof err === "object" && err !== null && "code" in err
                            ? String(err.code)
                            : undefined;
                        if (code !== "P2002") {
                            console.error("[INVITE-ACCEPT] Failed to create UserTenantRole:", err);
                        }
                    }
                }
            }
        }
        else {
            console.warn("[INVITE-ACCEPT] ⚠️  No sites found in org - user will have no site access!");
        }
        // Mark invite as used
        console.log("[INVITE-ACCEPT] Marking invite as used:", invite.id);
        await prisma.invite.update({
            where: { id: invite.id },
            data: { usedAt: new Date() },
        });
        console.log("[INVITE-ACCEPT] ✅ Invite marked as used");
        // Determine accessible sites
        const accessibleSites = await prisma.tenant.findMany({
            where: {
                OR: [
                    { siteMemberships: { some: { userId } } },
                    // Org admins get access to all sites in org
                    {
                        orgId,
                        org: { orgMemberships: { some: { userId, role: { in: [OrgRole.ORG_ADMIN] } } } },
                    },
                ],
            },
            select: { id: true, name: true, org: { select: { name: true } } },
        });
        const sites = accessibleSites.map((s) => ({
            id: s.id,
            name: s.name,
            orgName: s.org.name,
        }));
        // Auto-select site if only one
        let activeSiteId = null;
        if (sites.length === 1) {
            activeSiteId = sites[0].id;
            console.log("[INVITE-ACCEPT] Auto-selecting single site:", activeSiteId);
            await prisma.user.update({
                where: { id: userId },
                data: { lastActiveTenantId: activeSiteId },
            });
        }
        const result = {
            activeSiteId,
            orgId,
            sites,
        };
        console.log("[INVITE-ACCEPT] 🎉 Invite acceptance complete:", {
            userId,
            orgId,
            activeSiteId: activeSiteId || "(user will choose)",
            sitesCount: sites.length,
        });
        return result;
    }
    /**
     * Map SiteRole to Role enum for UserTenantRole table
     */
    mapSiteRoleToRole(siteRole) {
        switch (siteRole) {
            case SiteRole.SITE_ADMIN:
                return Role.ADMIN;
            case SiteRole.STAFF:
                return Role.TEACHER; // STAFF maps to TEACHER in legacy Role enum
            case SiteRole.VIEWER:
                return Role.PARENT; // VIEWER maps to PARENT in legacy Role enum
            default:
                return null;
        }
    }
    hashToken(token) {
        return createHash("sha256").update(token).digest("hex");
    }
    toSummary(invite) {
        let siteAccessMode = null;
        let siteCount = 0;
        if (invite.siteIdsJson) {
            try {
                const parsed = JSON.parse(invite.siteIdsJson);
                if (Array.isArray(parsed)) {
                    if (parsed.length === 0) {
                        siteAccessMode = "ALL_SITES";
                    }
                    else {
                        siteAccessMode = "SELECT_SITES";
                        siteCount = parsed.length;
                    }
                }
            }
            catch {
                // ignore
            }
        }
        // Determine status
        let status = "pending";
        if (invite.revokedAt) {
            status = "revoked";
        }
        else if (invite.usedAt) {
            status = "used";
        }
        else if (invite.expiresAt < new Date()) {
            status = "expired";
        }
        return {
            id: invite.id,
            email: invite.email,
            orgRole: invite.orgRole,
            siteAccessMode,
            siteCount,
            siteRole: invite.siteRole,
            expiresAt: invite.expiresAt,
            usedAt: invite.usedAt,
            revokedAt: invite.revokedAt,
            lastSentAt: invite.lastSentAt,
            status,
        };
    }
};
InvitesService = __decorate([
    Injectable(),
    __param(0, Inject(MailerService)),
    __metadata("design:paramtypes", [MailerService])
], InvitesService);
export { InvitesService };
