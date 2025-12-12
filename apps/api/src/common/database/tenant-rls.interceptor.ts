import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Scope,
} from "@nestjs/common";
import { PathwayRequestContext } from "@pathway/auth";
import { withTenantRlsContext } from "@pathway/db";
import { from, lastValueFrom } from "rxjs";

@Injectable({ scope: Scope.REQUEST })
export class TenantRlsInterceptor implements NestInterceptor {
  constructor(private readonly requestContext: PathwayRequestContext) {}

  intercept(_context: ExecutionContext, next: CallHandler) {
    const tenantId = this.requestContext.currentTenantId;
    if (!tenantId) {
      return next.handle();
    }
    const orgId = this.requestContext.currentOrgId ?? null;
    return from(
      withTenantRlsContext(tenantId, orgId, async () =>
        lastValueFrom(next.handle()),
      ),
    );
  }
}

