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
import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, Inject, } from "@nestjs/common";
import { CurrentOrg, CurrentTenant, CurrentUser, UserOrgRole, UserTenantRole, } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { z } from "zod";
import { ConcernsService } from "./concerns.service";
import { createConcernDto, updateConcernDto } from "./dto";
import { SafeguardingGuard } from "../common/safeguarding/safeguarding.guard";
import { AllowedSafeguardingRoles } from "../common/safeguarding/safeguarding.decorator";
const idParam = z.object({ id: z.string().uuid("id must be a valid UUID") });
const listQuery = z
    .object({
    childId: z.string().uuid().optional(),
})
    .strict();
const parseOrBadRequest = async (schema, data) => {
    try {
        return await schema.parseAsync(data);
    }
    catch (e) {
        if (e instanceof z.ZodError) {
            throw new BadRequestException(e.flatten());
        }
        throw e;
    }
};
let ConcernsController = class ConcernsController {
    service;
    constructor(service) {
        this.service = service;
    }
    buildContext(tenantId, orgId, actorUserId) {
        return { tenantId, orgId, actorUserId };
    }
    static safeguardingAdmins = {
        tenantRoles: [UserTenantRole.ADMIN],
        orgRoles: [UserOrgRole.SAFEGUARDING_LEAD, UserOrgRole.ORG_ADMIN],
    };
    static safeguardingDelete = {
        tenantRoles: [UserTenantRole.ADMIN],
        orgRoles: [UserOrgRole.ORG_ADMIN],
    };
    async create(body, tenantId, orgId, userId) {
        const dto = await parseOrBadRequest(createConcernDto, body);
        return this.service.create(dto, this.buildContext(tenantId, orgId, userId));
    }
    async findAll(query, tenantId, orgId, userId) {
        const q = await parseOrBadRequest(listQuery, query);
        return this.service.findAll({ childId: q.childId }, this.buildContext(tenantId, orgId, userId));
    }
    async findOne(params, tenantId, orgId, userId) {
        const { id } = await parseOrBadRequest(idParam, params);
        return this.service.findOne(id, this.buildContext(tenantId, orgId, userId));
    }
    async update(params, body, tenantId, orgId, userId) {
        const { id } = await parseOrBadRequest(idParam, params);
        const dto = await parseOrBadRequest(updateConcernDto, body);
        return this.service.update(id, dto, this.buildContext(tenantId, orgId, userId));
    }
    async remove(params, tenantId, orgId, userId) {
        const { id } = await parseOrBadRequest(idParam, params);
        return this.service.remove(id, this.buildContext(tenantId, orgId, userId));
    }
};
__decorate([
    Post(),
    AllowedSafeguardingRoles(ConcernsController.safeguardingAdmins),
    __param(0, Body()),
    __param(1, CurrentTenant("tenantId")),
    __param(2, CurrentOrg("orgId")),
    __param(3, CurrentUser("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ConcernsController.prototype, "create", null);
__decorate([
    Get(),
    AllowedSafeguardingRoles(ConcernsController.safeguardingAdmins),
    __param(0, Query()),
    __param(1, CurrentTenant("tenantId")),
    __param(2, CurrentOrg("orgId")),
    __param(3, CurrentUser("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ConcernsController.prototype, "findAll", null);
__decorate([
    Get(":id"),
    AllowedSafeguardingRoles(ConcernsController.safeguardingAdmins),
    __param(0, Param()),
    __param(1, CurrentTenant("tenantId")),
    __param(2, CurrentOrg("orgId")),
    __param(3, CurrentUser("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ConcernsController.prototype, "findOne", null);
__decorate([
    Patch(":id"),
    AllowedSafeguardingRoles(ConcernsController.safeguardingAdmins),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentTenant("tenantId")),
    __param(3, CurrentOrg("orgId")),
    __param(4, CurrentUser("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ConcernsController.prototype, "update", null);
__decorate([
    Delete(":id"),
    AllowedSafeguardingRoles(ConcernsController.safeguardingDelete),
    __param(0, Param()),
    __param(1, CurrentTenant("tenantId")),
    __param(2, CurrentOrg("orgId")),
    __param(3, CurrentUser("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", Promise)
], ConcernsController.prototype, "remove", null);
ConcernsController = __decorate([
    UseGuards(AuthUserGuard, SafeguardingGuard),
    Controller("concerns"),
    __param(0, Inject(ConcernsService)),
    __metadata("design:paramtypes", [ConcernsService])
], ConcernsController);
export { ConcernsController };
