import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  Scope,
  UnauthorizedException,
} from "@nestjs/common";
import { DEBUG_FALLBACK_TOKEN } from "../constants";
import { PathwayRequestContext } from "../context/pathway-request-context.service";
import type {
  AuthContext,
  PathwayAuthClaims,
} from "../types/auth-context";
import type { RequestWithAuthContext } from "../types/request-with-context";
import { UserOrgRole, UserTenantRole } from "../types/roles";

const ORG_ROLE_VALUES = new Set(Object.values(UserOrgRole));
const TENANT_ROLE_VALUES = new Set(Object.values(UserTenantRole));

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

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithAuthContext>();

    const claims = this.extractClaims(request);
    const authContext = this.mapClaimsToContext(claims);

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
      throw new UnauthorizedException("Unable to parse token payload");
    }
  }

  private mapClaimsToContext(claims: PathwayAuthClaims): AuthContext {
    const userClaims = claims["https://pathway.app/user"] ?? {};
    const orgClaims = claims["https://pathway.app/org"] ?? {};
    const tenantClaims = claims["https://pathway.app/tenant"];

    if (!tenantClaims?.tenantId) {
      throw new UnauthorizedException("Missing tenant claim");
    }

    const orgId =
      orgClaims.orgId ?? tenantClaims.orgId ?? claims.org_id ?? tenantClaims.tenantId;

    const roles = {
      org: this.parseOrgRoles(claims["https://pathway.app/org_roles"]),
      tenant: this.parseTenantRoles(claims["https://pathway.app/tenant_roles"]),
    };

    return {
      user: {
        userId: userClaims.id ?? claims.sub,
        email: userClaims.email,
        givenName: userClaims.givenName,
        familyName: userClaims.familyName,
        pictureUrl: userClaims.pictureUrl,
        authProvider: claims.iss?.includes("auth0.com") ? "auth0" : "debug",
      },
      org: {
        orgId,
        auth0OrgId: claims.org_id,
        slug: orgClaims.slug,
        name: orgClaims.name,
        planTier: orgClaims.planTier,
      },
      tenant: {
        tenantId: tenantClaims.tenantId,
        orgId,
        slug: tenantClaims.slug,
        timezone: tenantClaims.timezone,
        externalId: tenantClaims.externalId,
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
}
