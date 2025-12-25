/* eslint-disable no-cond-assign */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Inject, Injectable, Scope, UnauthorizedException, } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";
import { PATHWAY_CONTEXT_PROPERTY } from "../constants";
import { EMPTY_ROLE_SET } from "../types/roles";
/**
 * Stores the authenticated user + tenant/org context per request.
 * Guards populate it once and downstream services/controllers can read
 * without each endpoint plumbing tenantId params.
 */
let PathwayRequestContext = class PathwayRequestContext {
    request;
    scopedContext = null;
    constructor(request) {
        this.request = request;
    }
    setContext(context) {
        this.scopedContext = context;
        this.request[PATHWAY_CONTEXT_PROPERTY] = context;
    }
    clearContext() {
        this.scopedContext = null;
        delete this.request[PATHWAY_CONTEXT_PROPERTY];
    }
    getContext() {
        return this.scopedContext ?? this.request[PATHWAY_CONTEXT_PROPERTY] ?? null;
    }
    requireContext() {
        const context = this.getContext();
        if (!context) {
            throw new UnauthorizedException("PathwayRequestContext not initialised for this request");
        }
        return context;
    }
    get currentUserId() {
        return this.getContext()?.user.userId ?? null;
    }
    get currentOrgId() {
        return this.getContext()?.org.orgId ?? null;
    }
    get currentTenantId() {
        return this.getContext()?.tenant.tenantId ?? null;
    }
    get roles() {
        return this.getContext()?.roles ?? EMPTY_ROLE_SET;
    }
    get permissions() {
        return this.getContext()?.permissions ?? [];
    }
    /**
     * TODO(Epic1-Task1.2):
     *  - Inject this service into Prisma middleware so we never run a query
     *    without tenant/org filters.
     *  - Feed the tenantId into pg_backend_pid() SET app vars for future RLS policies.
     */
    describeForAudit() {
        const ctx = this.requireContext();
        return {
            user: ctx.user,
            org: ctx.org,
            tenant: ctx.tenant,
            roles: ctx.roles,
        };
    }
};
PathwayRequestContext = __decorate([
    Injectable({ scope: Scope.REQUEST }),
    __param(0, Inject(REQUEST)),
    __metadata("design:paramtypes", [Object])
], PathwayRequestContext);
export { PathwayRequestContext };
