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
  InternalServerErrorException,
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
    try {
      const userId = req.authUserId as string;

      if (!userId) {
        throw new UnauthorizedException("User ID not found in request");
      }

      // Check if user has ADMIN access to this org (OrgMembership or UserOrgRole)
      const membership = await prisma.orgMembership.findFirst({
        where: {
          userId,
          orgId,
          role: { in: [OrgRole.ORG_ADMIN] },
        },
      });
      const orgRole = membership
        ? null
        : await prisma.userOrgRole.findFirst({
            where: {
              userId,
              orgId,
              role: { in: [OrgRole.ORG_ADMIN] },
            },
          });

      if (!membership && !orgRole) {
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
      const orgRoleMembers = await prisma.userOrgRole.findMany({
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

      const memberByUserId = new Map<
        string,
        { user: { id: string; name: string | null; displayName: string | null; email: string | null }; role: OrgRole }
      >();
      for (const member of orgRoleMembers) {
        if (!member.user) continue;
        memberByUserId.set(member.user.id, {
          user: member.user,
          role: member.role,
        });
      }
      for (const member of orgMembers) {
        if (!member.user) continue;
        memberByUserId.set(member.user.id, {
          user: member.user,
          role: member.role,
        });
      }
      const validMembers = Array.from(memberByUserId.values());

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
      const people = validMembers.map((m) => {
        try {
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
          const isEmailValue = (val: string | null | undefined): boolean => {
            if (!val || typeof val !== "string" || val.length === 0) return false;
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
          };
          
          // Determine safe display name with fallback logic
          let safeDisplayName: string;
          if (displayName && displayName.length > 0 && !isEmailValue(displayName)) {
            safeDisplayName = displayName;
          } else if (name && name.length > 0) {
            safeDisplayName = name;
          } else if (email) {
            safeDisplayName = "User";
          } else {
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
        } catch (error) {
          console.error("[ORGS] Error mapping person:", error, m);
          // Return a safe fallback
          const user = m.user!;
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
    } catch (error) {
      console.error("[ORGS] listPeople error:", error instanceof Error ? error.message : String(error));
      // Re-throw known exceptions, wrap unknown ones
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      // Check if it's a Prisma error
      if (error && typeof error === "object" && "code" in error) {
        const prismaError = error as { code?: string; message?: string };
        console.error("[ORGS] Prisma error code:", prismaError.code);
        throw new InternalServerErrorException(
          `Database error: ${prismaError.message || "Unknown Prisma error"}`,
        );
      }
      throw new InternalServerErrorException(
        `Failed to list people: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
