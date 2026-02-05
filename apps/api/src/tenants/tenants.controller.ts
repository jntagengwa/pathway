import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Body,
  Req,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  UseGuards,
  Inject,
} from "@nestjs/common";
import type { Request } from "express";
import { TenantsService } from "./tenants.service";
import { createTenantDto } from "./dto/create-tenant.dto";
import { updateTenantDto } from "./dto/update-tenant.dto";
import type { CreateTenantDto } from "./dto/create-tenant.dto";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { OrgRole, SiteRole, prisma } from "@pathway/db";

interface AuthenticatedRequest extends Request {
  authUserId?: string;
}

@Controller("tenants")
export class TenantsController {
  constructor(@Inject(TenantsService) private readonly svc: TenantsService) {}

  @Get()
  async list() {
    return this.svc.list();
  }

  @Get(":slug")
  async bySlug(@Param("slug") slug: string) {
    return this.svc.getBySlug(slug);
  }

  @Post()
  async create(@Body() body: CreateTenantDto) {
    const result = createTenantDto.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.format());
    }
    return this.svc.create(result.data);
  }

  /**
   * Update tenant (site) profile. SITE_ADMIN for this site or ORG_ADMIN for site's org.
   */
  @Patch(":tenantId")
  @UseGuards(AuthUserGuard)
  async updateProfile(
    @Param("tenantId") tenantId: string,
    @Req() req: AuthenticatedRequest,
    @Body() body: unknown,
  ) {
    const userId = req.authUserId;
    if (!userId) {
      throw new UnauthorizedException("User ID not found in request");
    }
    const result = updateTenantDto.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.format());
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, orgId: true },
    });
    if (!tenant) {
      throw new BadRequestException("Tenant not found");
    }

    const [siteMembership, orgMembership, userOrgRole] = await Promise.all([
      prisma.siteMembership.findFirst({
        where: { userId, tenantId, role: SiteRole.SITE_ADMIN },
      }),
      prisma.orgMembership.findFirst({
        where: { userId, orgId: tenant.orgId, role: OrgRole.ORG_ADMIN },
      }),
      prisma.userOrgRole.findFirst({
        where: { userId, orgId: tenant.orgId, role: OrgRole.ORG_ADMIN },
      }),
    ]);

    const canEdit =
      siteMembership !== null ||
      orgMembership !== null ||
      userOrgRole !== null;
    if (!canEdit) {
      throw new ForbiddenException(
        "You must be a site admin for this site or an org admin to edit site profile",
      );
    }

    return this.svc.updateProfile(tenantId, userId, result.data);
  }
}
