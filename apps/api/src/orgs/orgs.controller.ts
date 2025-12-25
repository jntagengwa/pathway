import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Req,
  UnauthorizedException,
  Inject,
} from "@nestjs/common";
import { z } from "zod";
import { OrgsService } from "./orgs.service";
import { registerOrgDto } from "./dto/register-org.dto";
import { CurrentOrg } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { OrgRole, prisma } from "@pathway/db";
import type { Request } from "express";

interface AuthenticatedRequest extends Request {
  authUserId?: string;
}

const parseOrBadRequest = async <T>(
  schema: z.ZodTypeAny,
  data: unknown,
): Promise<T> => {
  try {
    return await schema.parseAsync(data);
  } catch (e) {
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

@Controller("orgs")
export class OrgsController {
  constructor(@Inject(OrgsService) private readonly service: OrgsService) {}

  /**
   * Registers a new organisation (and optional first tenant), optionally bootstrapping billing.
   * Accepts the DTO defined in register-org.dto. Returns created org, initial tenant (if any),
   * and admin/billing outcomes.
   */
  @Post("register")
  async register(@Body() body: unknown) {
    const dto = await parseOrBadRequest<typeof registerOrgDto._output>(
      registerOrgDto,
      body,
    );
    return this.service.register(dto);
  }

  /**
   * List organisations (MVP: no filters).
   */
  @Get()
  @UseGuards(AuthUserGuard)
  async list(@CurrentOrg("orgId") orgId: string) {
    return this.service.list(orgId);
  }

  /**
   * Fetch an organisation by slug.
   */
  @Get(":slug")
  @UseGuards(AuthUserGuard)
  async getBySlug(
    @Param() params: unknown,
    @CurrentOrg("orgId") orgId: string,
  ) {
    const { slug } = await parseOrBadRequest<typeof slugParam._output>(
      slugParam,
      params,
    );
    return this.service.getBySlug(slug, orgId);
  }

  /**
   * List people (users) with access to an organisation.
   * Returns users with their org role and site access summary.
   * Requires Org ADMIN access.
   */
  @Get(":orgId/people")
  @UseGuards(AuthUserGuard)
  async listPeople(@Param("orgId") orgId: string, @Req() req: AuthenticatedRequest) {
    const userId = req.authUserId as string;

    // Check if user has ADMIN access to this org
    const membership = await prisma.orgMembership.findFirst({
      where: {
        userId,
        orgId,
        role: { in: [OrgRole.ORG_ADMIN] },
      },
    });

    if (!membership) {
      throw new UnauthorizedException(
        "You must be an Org Admin to view people",
      );
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
    const siteCountMap = new Map<string, number>();
    for (const sm of siteMembers) {
      siteCountMap.set(sm.userId, (siteCountMap.get(sm.userId) || 0) + 1);
    }

    // Build response
    const people = orgMembers.map((m) => {
      const siteCount = siteCountMap.get(m.user.id) || 0;
      const allSites = m.role === OrgRole.ORG_ADMIN; // Admins have implicit access

      return {
        id: m.user.id,
        name: m.user.displayName || m.user.name || "Unknown",
        email: m.user.email || "",
        orgRole: m.role,
        siteAccessSummary: {
          allSites,
          siteCount,
        },
      };
    });

    return people;
  }
}
