var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, } from "@nestjs/common";
import { withTenantRlsContext } from "@pathway/db";
import { from, lastValueFrom } from "rxjs";
/**
 * RLS Interceptor that sets tenant context for database queries.
 * Reads tenant/org from the __pathwayContext set by AuthUserGuard.
 */
let TenantRlsInterceptor = class TenantRlsInterceptor {
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const pathwayContext = request.__pathwayContext;
        if (!pathwayContext?.tenant?.tenantId) {
            // No tenant context - skip RLS (e.g., for org-level or public endpoints)
            return next.handle();
        }
        const tenantId = pathwayContext.tenant.tenantId;
        const orgId = pathwayContext.org?.orgId || null;
        return from(withTenantRlsContext(tenantId, orgId, async () => lastValueFrom(next.handle())));
    }
};
TenantRlsInterceptor = __decorate([
    Injectable()
], TenantRlsInterceptor);
export { TenantRlsInterceptor };
