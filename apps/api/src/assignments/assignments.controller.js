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
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Inject, } from "@nestjs/common";
import { AssignmentsService } from "./assignments.service";
import { z } from "zod";
import { createAssignmentDto, } from "./dto/create-assignment.dto";
import { updateAssignmentDto, } from "./dto/update-assignment.dto";
import { AssignmentStatus, Role } from "@pathway/db";
import { CurrentTenant, CurrentOrg } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { UseGuards } from "@nestjs/common";
import { EntitlementsEnforcementService } from "../billing/entitlements-enforcement.service";
let AssignmentsController = class AssignmentsController {
    assignmentsService;
    enforcement;
    constructor(assignmentsService, enforcement) {
        this.assignmentsService = assignmentsService;
        this.enforcement = enforcement;
    }
    async create(body, tenantId, orgId) {
        const dto = createAssignmentDto.parse(body);
        const av30 = await this.enforcement.checkAv30ForOrg(orgId);
        this.enforcement.assertWithinHardCap(av30);
        // TODO(Epic4-UI): Surface av30 status in response metadata for warnings
        return this.assignmentsService.create(dto, tenantId);
    }
    async findAll(query, tenantId) {
        const querySchema = z.object({
            sessionId: z.string().uuid().optional(),
            userId: z.string().uuid().optional(),
            role: z.nativeEnum(Role).optional(),
            status: z.nativeEnum(AssignmentStatus).optional(),
        });
        const filters = querySchema.parse(query);
        return this.assignmentsService.findAll({
            tenantId,
            ...(filters.sessionId ? { sessionId: filters.sessionId } : {}),
            ...(filters.userId ? { userId: filters.userId } : {}),
            ...(filters.role ? { role: filters.role } : {}),
            ...(filters.status ? { status: filters.status } : {}),
        });
    }
    async findOne(id, tenantId) {
        // validate id format
        z.string().uuid().parse(id);
        return this.assignmentsService.findOne(id, tenantId);
    }
    async update(id, body, tenantId) {
        z.string().uuid().parse(id);
        const dto = updateAssignmentDto.parse(body);
        return this.assignmentsService.update(id, dto, tenantId);
    }
    async remove(id, tenantId) {
        z.string().uuid().parse(id);
        await this.assignmentsService.remove(id, tenantId);
        return { id, deleted: true };
    }
};
__decorate([
    Post(),
    __param(0, Body()),
    __param(1, CurrentTenant("tenantId")),
    __param(2, CurrentOrg("orgId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, Query()),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "findAll", null);
__decorate([
    Get(":id"),
    __param(0, Param("id")),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "findOne", null);
__decorate([
    Patch(":id"),
    __param(0, Param("id")),
    __param(1, Body()),
    __param(2, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "update", null);
__decorate([
    Delete(":id"),
    __param(0, Param("id")),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AssignmentsController.prototype, "remove", null);
AssignmentsController = __decorate([
    UseGuards(AuthUserGuard),
    Controller("assignments"),
    __param(0, Inject(AssignmentsService)),
    __param(1, Inject(EntitlementsEnforcementService)),
    __metadata("design:paramtypes", [AssignmentsService,
        EntitlementsEnforcementService])
], AssignmentsController);
export { AssignmentsController };
