import {
  Inject,
  Injectable,
  Scope,
  UnauthorizedException,
} from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { PATHWAY_CONTEXT_PROPERTY } from "../constants";
import type { AuthContext } from "../types/auth-context";
import type { RequestWithAuthContext } from "../types/request-with-context";
import { EMPTY_ROLE_SET } from "../types/roles";

/**
 * Stores the authenticated user + tenant/org context per request.
 * Guards populate it once and downstream services/controllers can read
 * without each endpoint plumbing tenantId params.
 */
@Injectable({ scope: Scope.REQUEST })
export class PathwayRequestContext {
  private scopedContext: AuthContext | null = null;

  constructor(
    @Inject(REQUEST) private readonly request: RequestWithAuthContext,
  ) {}

  setContext(context: AuthContext) {
    this.scopedContext = context;
    this.request[PATHWAY_CONTEXT_PROPERTY] = context;
  }

  clearContext() {
    this.scopedContext = null;
    delete this.request[PATHWAY_CONTEXT_PROPERTY];
  }

  getContext(): AuthContext | null {
    return this.scopedContext ?? this.request[PATHWAY_CONTEXT_PROPERTY] ?? null;
  }

  requireContext(): AuthContext {
    const context = this.getContext();
    if (!context) {
      throw new UnauthorizedException(
        "PathwayRequestContext not initialised for this request",
      );
    }
    return context;
  }

  get currentUserId(): string | null {
    return this.getContext()?.user.userId ?? null;
  }

  get currentOrgId(): string | null {
    return this.getContext()?.org.orgId ?? null;
  }

  get currentTenantId(): string | null {
    return this.getContext()?.tenant.tenantId ?? null;
  }

  get roles() {
    return this.getContext()?.roles ?? EMPTY_ROLE_SET;
  }

  get permissions(): string[] {
    return this.getContext()?.permissions ?? [];
  }

  /**
   * TODO(Epic1-Task1.2):
   *  - Inject this service into Prisma middleware so we never run a query
   *    without tenant/org filters.
   *  - Feed the tenantId into pg_backend_pid() SET app vars for future RLS policies.
   */
  describeForAudit(): Pick<AuthContext, "user" | "org" | "tenant" | "roles"> {
    const ctx = this.requireContext();
    return {
      user: ctx.user,
      org: ctx.org,
      tenant: ctx.tenant,
      roles: ctx.roles,
    };
  }
}

