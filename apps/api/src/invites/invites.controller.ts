import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UnauthorizedException,
  Inject,
} from "@nestjs/common";
import { InvitesService } from "./invites.service";
import { CreateInviteDto } from "./dto/create-invite.dto";
import { AcceptInviteDto } from "./dto/accept-invite.dto";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { OrgRole, prisma } from "@pathway/db";
import type { Request } from "express";

interface AuthenticatedRequest extends Request {
  authUserId?: string;
}

@Controller()
export class InvitesController {
  constructor(@Inject(InvitesService) private readonly invitesService: InvitesService) {}

  /**
   * Create a new invite (Org OWNER/ADMIN only)
   */
  @UseGuards(AuthUserGuard)
  @Post("orgs/:orgId/invites")
  async createInvite(
    @Param("orgId") orgId: string,
    @Body() dto: CreateInviteDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.authUserId as string;

    // Check if user has OWNER or ADMIN role for this org
    await this.requireOrgAdminAccess(userId, orgId);

    return this.invitesService.createInvite(orgId, userId, dto);
  }

  /**
   * Resend an invite (Org OWNER/ADMIN only)
   */
  @UseGuards(AuthUserGuard)
  @Post("orgs/:orgId/invites/:inviteId/resend")
  async resendInvite(
    @Param("orgId") orgId: string,
    @Param("inviteId") inviteId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.authUserId as string;
    await this.requireOrgAdminAccess(userId, orgId);

    return this.invitesService.resendInvite(orgId, inviteId);
  }

  /**
   * Revoke an invite (Org OWNER/ADMIN only)
   */
  @UseGuards(AuthUserGuard)
  @Post("orgs/:orgId/invites/:inviteId/revoke")
  async revokeInvite(
    @Param("orgId") orgId: string,
    @Param("inviteId") inviteId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.authUserId as string;
    await this.requireOrgAdminAccess(userId, orgId);

    return this.invitesService.revokeInvite(orgId, inviteId);
  }

  /**
   * List invites for an org (Org OWNER/ADMIN only)
   */
  @UseGuards(AuthUserGuard)
  @Get("orgs/:orgId/invites")
  async listInvites(
    @Param("orgId") orgId: string,
    @Query("status") status?: "pending" | "used" | "expired" | "revoked",
    @Req() req?: AuthenticatedRequest,
  ) {
    const userId = req?.authUserId as string;
    await this.requireOrgAdminAccess(userId, orgId);

    return this.invitesService.listInvites(orgId, status);
  }

  /**
   * Accept an invite (authenticated user only)
   */
  @UseGuards(AuthUserGuard)
  @Post("invites/accept")
  async acceptInvite(@Body() dto: AcceptInviteDto, @Req() req: AuthenticatedRequest) {
    const userId = req.authUserId as string;

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
  private async requireOrgAdminAccess(
    userId: string,
    orgId: string,
  ): Promise<void> {
    const membership = await prisma.orgMembership.findFirst({
      where: {
        userId,
        orgId,
        role: { in: [OrgRole.ORG_ADMIN] },
      },
    });

    if (!membership) {
      throw new UnauthorizedException(
        "You must be an Org Admin to manage invites",
      );
    }
  }
}

