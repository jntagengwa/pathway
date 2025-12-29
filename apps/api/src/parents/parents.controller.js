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
import { Controller, Get, Param, UseGuards, NotFoundException, ForbiddenException, Inject, } from "@nestjs/common";
import { CurrentOrg, CurrentTenant, PathwayRequestContext, UserOrgRole, UserTenantRole, } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { ParentsService } from "./parents.service";
let ParentsController = class ParentsController {
    parentsService;
    requestContext;
    constructor(parentsService, requestContext) {
        this.parentsService = parentsService;
        this.requestContext = requestContext;
    }
    async list(tenantId, orgId) {
        this.assertStaffAccess();
        return this.parentsService.findAllForTenant(tenantId, orgId);
    }
    async getOne(id, tenantId, orgId) {
        this.assertStaffAccess();
        const parent = await this.parentsService.findOneForTenant(tenantId, orgId, id);
        if (!parent) {
            throw new NotFoundException("Parent not found");
        }
        return parent;
    }
    assertStaffAccess() {
        const roles = this.requestContext.roles;
        const allowedTenant = [
            UserTenantRole.ADMIN,
            UserTenantRole.COORDINATOR,
            UserTenantRole.TEACHER,
            UserTenantRole.STAFF,
        ];
        const allowedOrg = [UserOrgRole.ORG_ADMIN, UserOrgRole.SAFEGUARDING_LEAD];
        const allowed = roles.tenant.some((role) => allowedTenant.includes(role)) ||
            roles.org.some((role) => allowedOrg.includes(role));
        if (!allowed) {
            throw new ForbiddenException("Insufficient role to access parents/guardians");
        }
    }
};
__decorate([
    Get(),
    __param(0, CurrentTenant("tenantId")),
    __param(1, CurrentOrg("orgId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ParentsController.prototype, "list", null);
__decorate([
    Get(":id"),
    __param(0, Param("id")),
    __param(1, CurrentTenant("tenantId")),
    __param(2, CurrentOrg("orgId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ParentsController.prototype, "getOne", null);
ParentsController = __decorate([
    Controller("parents"),
    UseGuards(AuthUserGuard),
    __param(0, Inject(ParentsService)),
    __param(1, Inject(PathwayRequestContext)),
    __metadata("design:paramtypes", [ParentsService,
        PathwayRequestContext])
], ParentsController);
export { ParentsController };
