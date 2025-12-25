import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  Scope,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";
import { DEBUG_FALLBACK_TOKEN } from "../constants";
import { PathwayRequestContext } from "../context/pathway-request-context.service";
import type { AuthContext, PathwayAuthClaims } from "../types/auth-context";
import type { RequestWithAuthContext } from "../types/request-with-context";
import { UserOrgRole, UserTenantRole } from "../types/roles";
import { OrgRole, SiteRole, prisma } from "@pathway/db";

const ORG_ROLE_VALUES = new Set(Object.values(UserOrgRole));
const TENANT_ROLE_VALUES = new Set(Object.values(UserTenantRole));
type DbUser = Awaited<ReturnType<typeof prisma.user.create>>;

const DEFAULT_DEBUG_CLAIMS: PathwayAuthClaims = {
  sub: "debug|staff",
  "https://pathway.app/user": {
    id: "debug-user-1",
    email: "debug.staff@pathway.local",
    givenName: "Debug",
    familyName: "Staff",
  },
  "https://pathway.app/org": {
    orgId: "org-debug-0001",
    slug: "debug-academy",
    name: "Debug Academy",
  },
  "https://pathway.app/tenant": {
    tenantId: "ten-debug-0001",
    orgId: "org-debug-0001",
    slug: "debug-academy-main",
    timezone: "Europe/London",
  },
  "https://pathway.app/org_roles": [
    UserOrgRole.ORG_ADMIN,
    UserOrgRole.SAFEGUARDING_LEAD,
  ],
  "https://pathway.app/tenant_roles": [UserTenantRole.COORDINATOR],
  "https://pathway.app/permissions": ["attendance:write"],
  org_id: "auth0|debug-org",
};

@Injectable({ scope: Scope.REQUEST })
export class PathwayAuthGuard implements CanActivate {
  private readonly logger = new Logger(PathwayAuthGuard.name);

  constructor(private readonly requestContext: PathwayRequestContext) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAuthContext>();

    const claims = this.extractClaims(request);
    const authContext = await this.mapClaimsToContext(claims, request);

    this.requestContext.setContext(authContext);

    // TODO(Epic1-Task1.2): attach org/tenant ids as headers for downstream services (BullMQ workers, etc.)
    request.headers["x-pathway-tenant-id"] = authContext.tenant.tenantId;
    request.headers["x-pathway-org-id"] = authContext.org.orgId;

    return true;
  }

  private extractClaims(request: RequestWithAuthContext): PathwayAuthClaims {
    const raw = request.headers.authorization;
    if (!raw) {
      // During Task 1.1 we allow a debug-only context so we can wire controllers incrementally.
      return DEFAULT_DEBUG_CLAIMS;
    }

    const [scheme, token] = raw.split(" ");
    if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
      throw new UnauthorizedException("Unsupported Authorization header");
    }

    if (token === DEBUG_FALLBACK_TOKEN) {
      return DEFAULT_DEBUG_CLAIMS;
    }

    const [, payload] = token.split(".");
    if (!payload) {
      const fallback = this.tryDevTokenFallback();
      if (fallback) return fallback;
      throw new UnauthorizedException("Malformed JWT payload");
    }

    try {
      const decoded = Buffer.from(payload, "base64url").toString("utf8");
      return JSON.parse(decoded) as PathwayAuthClaims;
    } catch (error) {
      this.logger.error(
        "Unable to parse token payload",
        error instanceof Error ? error.stack : undefined,
      );
      const fallback = this.tryDevTokenFallback();
      if (fallback) return fallback;
      throw new UnauthorizedException("Unable to parse token payload");
    }
  }

  /**
   * Developer helper: if a token is malformed in dev/test, try a local
   * fallback token or the default debug claims. Does not run in production.
   */
  private tryDevTokenFallback(): PathwayAuthClaims | null {
    if (process.env.NODE_ENV === "production") return null;

    const devToken =
      process.env.NEXT_PUBLIC_DEV_BEARER_TOKEN ?? process.env.DEV_BEARER_TOKEN;
    if (devToken) {
      const [, devPayload] = devToken.split(".");
      if (devPayload) {
        try {
          const decoded = Buffer.from(devPayload, "base64url").toString("utf8");
          return JSON.parse(decoded) as PathwayAuthClaims;
        } catch (error) {
          this.logger.warn(
            "Dev token fallback failed to parse payload",
            error instanceof Error ? error.message : String(error),
          );
        }
      }
    }

    return DEFAULT_DEBUG_CLAIMS;
  }

  private async mapClaimsToContext(
    claims: PathwayAuthClaims,
    request: Request,
  ): Promise<AuthContext> {
    const user = await this.resolveUserFromClaims(claims);
    const userClaims = claims["https://pathway.app/user"] ?? {};
    const tenantCtx = await this.resolveTenantContext(user.id, claims, request);
    const roles = await this.resolveRoles(
      user.id,
      tenantCtx.orgId,
      tenantCtx.tenantId,
      claims,
    );
    const orgClaims = (claims["https://pathway.app/org"] ?? {}) as NonNullable<
      PathwayAuthClaims["https://pathway.app/org"]
    >;

    return {
      user: {
        userId: user.id,
        email: user.email ?? undefined,
        givenName: user.displayName ?? user.name ?? undefined,
        familyName: undefined,
        pictureUrl: userClaims.pictureUrl ?? undefined,
        authProvider: claims.iss?.includes("auth0.com") ? "auth0" : "debug",
      },
      org: {
        orgId: tenantCtx.orgId,
        auth0OrgId: claims.org_id,
        slug: tenantCtx.orgSlug,
        name: tenantCtx.orgName,
        planTier: orgClaims.planTier,
      },
      tenant: {
        tenantId: tenantCtx.tenantId,
        orgId: tenantCtx.orgId,
        slug: tenantCtx.tenantSlug,
        timezone: tenantCtx.tenantTimezone,
        externalId: tenantCtx.tenantExternalId,
      },
      roles,
      permissions: this.parsePermissions(
        claims["https://pathway.app/permissions"],
      ),
      rawClaims: claims,
      issuedAt: claims.iat,
      expiresAt: claims.exp,
    };
  }

  private async resolveUserFromClaims(
    claims: PathwayAuthClaims,
  ): Promise<DbUser> {
    const provider = claims.iss?.includes("auth0") ? "auth0" : "debug";
    const subject = claims.sub;
    if (!subject) {
      throw new UnauthorizedException("Missing sub in token");
    }

    const userClaims = claims["https://pathway.app/user"] ?? {};
    const email = userClaims.email ?? claims.email;
    const name =
      userClaims.givenName ??
      claims.name ??
      [userClaims.givenName, userClaims.familyName]
        .filter(Boolean)
        .join(" ")
        .trim();

    const identity = await prisma.userIdentity.findUnique({
      where: {
        provider_providerSubject: {
          provider,
          providerSubject: subject,
        },
      },
      include: { user: true },
    });

    if (identity?.user) {
      const updates: Record<string, string | null | undefined> = {};
      if (email && identity.user.email !== email) {
        updates.email = email;
      }
      if (name && identity.user.displayName !== name) {
        updates.displayName = name;
        if (!identity.user.name) {
          updates.name = name;
        }
      }
      if (Object.keys(updates).length > 0) {
        await prisma.user.update({
          where: { id: identity.userId },
          data: updates,
        });
      }
      return identity.user;
    }

    const normalizedEmail = email?.trim().toLowerCase() || undefined;
    let existingUser: DbUser | null = null;
    if (normalizedEmail) {
      existingUser = await prisma.user.findFirst({
        where: {
          email: {
            equals: normalizedEmail,
            mode: "insensitive",
          },
        },
      });
    }

    let user: DbUser;
    if (existingUser) {
      user = existingUser;
    } else {
      try {
        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            displayName: name || undefined,
            name: name || undefined,
          },
        });
      } catch (err) {
        const code =
          typeof err === "object" && err !== null && "code" in err
            ? String((err as { code?: unknown }).code)
            : undefined;
        if (code === "P2002" && normalizedEmail) {
          const fallback = await prisma.user.findFirst({
            where: {
              email: {
                equals: normalizedEmail,
                mode: "insensitive",
              },
            },
          });
          if (fallback) {
            user = fallback;
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
    }

    await prisma.userIdentity.create({
      data: {
        userId: user.id,
        provider,
        providerSubject: subject,
        email: email ?? undefined,
        displayName: name || undefined,
      },
    });

    return user;
  }

  private async resolveTenantContext(
    userId: string,
    claims: PathwayAuthClaims,
    request: Request,
  ) {
    const userClaims = claims["https://pathway.app/user"] ?? {};
    const orgClaims = claims["https://pathway.app/org"] ?? {};
    const tenantClaims = claims["https://pathway.app/tenant"];

    const cookieTenantId = this.readCookie(request, "pw_active_site_id");
    const cookieOrgId = this.readCookie(request, "pw_active_org_id");

    const tenantId =
      tenantClaims?.tenantId ??
      cookieTenantId ??
      userClaims.lastActiveTenantId ??
      null;

    if (!tenantId) {
      throw new UnauthorizedException("No active site selected");
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, orgId: true, slug: true },
    });
    if (!tenant) {
      throw new UnauthorizedException("Unknown site");
    }

    const orgId =
      orgClaims.orgId ?? tenantClaims?.orgId ?? cookieOrgId ?? tenant.orgId;

    const siteMembership = await prisma.siteMembership.findFirst({
      where: { tenantId: tenant.id, userId },
    });
    if (!siteMembership) {
      throw new UnauthorizedException(
        "User is not a member of the active site",
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { lastActiveTenantId: tenant.id },
    });

    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: { id: true, name: true, slug: true },
    });

    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tenantTimezone: tenantClaims?.timezone,
      tenantExternalId: tenantClaims?.externalId,
      orgId,
      orgName: org?.name,
      orgSlug: org?.slug ?? orgClaims.slug,
    };
  }

  private parseOrgRoles(claims: string[] | undefined): UserOrgRole[] {
    if (!claims) return [];
    return claims
      .filter((value): value is UserOrgRole =>
        ORG_ROLE_VALUES.has(value as UserOrgRole),
      )
      .map((value) => value as UserOrgRole);
  }

  private parseTenantRoles(claims: string[] | undefined): UserTenantRole[] {
    if (!claims) return [];
    return claims
      .filter((value): value is UserTenantRole =>
        TENANT_ROLE_VALUES.has(value as UserTenantRole),
      )
      .map((value) => value as UserTenantRole);
  }

  private parsePermissions(claims: unknown): string[] {
    if (!Array.isArray(claims)) {
      return [];
    }
    return claims.filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    );
  }

  private readCookie(request: Request, name: string): string | null {
    const header = request.headers?.cookie;
    if (!header) return null;
    const parts = header.split(";").map((part) => part.trim());
    for (const part of parts) {
      const [key, ...rest] = part.split("=");
      if (key === name) {
        return rest.join("=");
      }
    }
    return null;
  }

  private async resolveRoles(
    userId: string,
    orgId: string,
    tenantId: string,
    claims: PathwayAuthClaims,
  ) {
    const siteMembership = await prisma.siteMembership.findFirst({
      where: { tenantId, userId },
    });
    const orgMemberships = await prisma.orgMembership.findMany({
      where: { orgId, userId },
    });

    const tenantRolesFromMembership: UserTenantRole[] = [];
    if (siteMembership?.role === SiteRole.SITE_ADMIN) {
      tenantRolesFromMembership.push(UserTenantRole.ADMIN);
    } else if (siteMembership?.role === SiteRole.STAFF) {
      tenantRolesFromMembership.push(UserTenantRole.STAFF);
    } else if (siteMembership?.role === SiteRole.VIEWER) {
      tenantRolesFromMembership.push(UserTenantRole.TEACHER);
    }

    const orgRolesFromMembership: UserOrgRole[] = [];
    orgMemberships.forEach((membership: { role: OrgRole }) => {
      if (membership.role === OrgRole.ORG_ADMIN) {
        orgRolesFromMembership.push(UserOrgRole.ORG_ADMIN);
      } else if (membership.role === OrgRole.ORG_BILLING) {
        orgRolesFromMembership.push(UserOrgRole.BILLING_MANAGER);
      } else if (membership.role === OrgRole.ORG_MEMBER) {
        orgRolesFromMembership.push(UserOrgRole.SUPPORT);
      }
    });

    const orgRoles = Array.from(
      new Set([
        ...orgRolesFromMembership,
        ...this.parseOrgRoles(claims["https://pathway.app/org_roles"]),
      ]),
    );
    const tenantRoles = Array.from(
      new Set([
        ...tenantRolesFromMembership,
        ...this.parseTenantRoles(claims["https://pathway.app/tenant_roles"]),
      ]),
    );

    return { org: orgRoles, tenant: tenantRoles };
  }
}
