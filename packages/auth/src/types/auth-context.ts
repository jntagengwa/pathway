import type { RoleSet } from "./roles";

export interface UserIdentity {
  userId: string;
  email?: string;
  givenName?: string;
  familyName?: string;
  pictureUrl?: string;
  authProvider?: "auth0" | "debug";
}

export interface OrgContext {
  /**
   * Internal org identifier (maps to `orgs.id` in Postgres).
   */
  orgId: string;
  /**
   * Reference back to the Auth0 Organisation (for support workflows).
   */
  auth0OrgId?: string;
  slug?: string;
  name?: string;
  planTier?: string;
}

export interface TenantContext {
  /**
   * Primary key for the tenant row. This is what we feed into Prisma filters + Postgres RLS.
   */
  tenantId: string;
  orgId: string;
  slug?: string;
  timezone?: string;
  externalId?: string; // Allows MIS integrations to sync by remote ID later.
}

export interface AuthContext {
  user: UserIdentity;
  org: OrgContext;
  tenant: TenantContext;
  roles: RoleSet;
  permissions: string[];
  rawClaims: Record<string, unknown>;
  issuedAt?: number;
  expiresAt?: number;
}

/**
 * Shape of the Auth0 JWT payload we expect once real integration lands.
 * We keep it lenient for now and log TODOs where the claims need finishing.
 */
export interface PathwayAuthClaims {
  sub: string;
  org_id?: string; // Auth0 Organisation GUID
  "https://pathway.app/user"?: {
    id?: string;
    email?: string;
    givenName?: string;
    familyName?: string;
    pictureUrl?: string;
  };
  "https://pathway.app/org"?: {
    orgId?: string;
    slug?: string;
    name?: string;
    planTier?: string;
  };
  "https://pathway.app/tenant"?: {
    tenantId: string;
    orgId?: string;
    slug?: string;
    timezone?: string;
    externalId?: string;
  };
  "https://pathway.app/org_roles"?: string[];
  "https://pathway.app/tenant_roles"?: string[];
  "https://pathway.app/permissions"?: string[];
  iss?: string;
  aud?: string | string[];
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export type PartialClaims = Partial<PathwayAuthClaims>;

