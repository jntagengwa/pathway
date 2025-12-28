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
import { ForbiddenException, Injectable, Inject, } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PathwayRequestContext } from "@pathway/auth";
import { SAFEGUARDING_ROLES_KEY } from "./safeguarding.decorator";
let SafeguardingGuard = class SafeguardingGuard {
    reflector;
    requestContext;
    constructor(reflector, requestContext) {
        this.reflector = reflector;
        this.requestContext = requestContext;
    }
    canActivate(context) {
        const requirement = this.reflector.getAllAndOverride(SAFEGUARDING_ROLES_KEY, [context.getHandler(), context.getClass()]);
        if (!requirement) {
            return true;
        }
        const roles = this.requestContext.roles;
        const hasTenantRole = requirement.tenantRoles?.some((role) => roles.tenant.includes(role)) ??
            false;
        const hasOrgRole = requirement.orgRoles?.some((role) => roles.org.includes(role)) ?? false;
        if (hasTenantRole || hasOrgRole) {
            return true;
        }
        throw new ForbiddenException("Insufficient safeguarding permissions");
    }
};
SafeguardingGuard = __decorate([
    Injectable(),
    __param(0, Inject(Reflector)),
    __param(1, Inject(PathwayRequestContext)),
    __metadata("design:paramtypes", [Reflector,
        PathwayRequestContext])
], SafeguardingGuard);
export { SafeguardingGuard };
