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
import { Controller, Get, Param, Post, Patch, Delete, Body, Query, BadRequestException, UseGuards, Inject, } from "@nestjs/common";
import { SessionsService } from "./sessions.service";
import { CurrentTenant, CurrentOrg } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { EntitlementsEnforcementService } from "../billing/entitlements-enforcement.service";
function parseDateOrThrow(label, value) {
    if (value == null)
        return undefined;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
        throw new BadRequestException(`${label} must be a valid ISO date`);
    }
    return d;
}
let SessionsController = class SessionsController {
    svc;
    enforcement;
    constructor(svc, enforcement) {
        this.svc = svc;
        this.enforcement = enforcement;
    }
    async list(q, tenantId) {
        const filters = {
            tenantId,
            groupId: q.groupId,
            from: parseDateOrThrow("from", q.from),
            to: parseDateOrThrow("to", q.to),
        };
        return this.svc.list(filters);
    }
    async getById(id, tenantId) {
        return this.svc.getById(id, tenantId);
    }
    async create(dto, tenantId, orgId) {
        if (dto.startsAt &&
            dto.endsAt &&
            new Date(dto.endsAt) <= new Date(dto.startsAt)) {
            throw new BadRequestException("endsAt must be after startsAt");
        }
        if (dto.tenantId && dto.tenantId !== tenantId) {
            throw new BadRequestException("tenantId must match current tenant");
        }
        const av30 = await this.enforcement.checkAv30ForOrg(orgId);
        this.enforcement.assertWithinHardCap(av30);
        // TODO(Epic4-UI): Surface av30 status in response metadata for warnings
        return this.svc.create({ ...dto, tenantId }, tenantId);
    }
    async update(id, dto, tenantId) {
        if (dto.startsAt &&
            dto.endsAt &&
            new Date(dto.endsAt) <= new Date(dto.startsAt)) {
            throw new BadRequestException("endsAt must be after startsAt");
        }
        if (dto.tenantId && dto.tenantId !== tenantId) {
            throw new BadRequestException("tenantId must match current tenant");
        }
        return this.svc.update(id, dto, tenantId);
    }
    async delete(id, tenantId) {
        return this.svc.delete(id, tenantId);
    }
};
__decorate([
    Get(),
    UseGuards(AuthUserGuard),
    __param(0, Query()),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "list", null);
__decorate([
    Get(":id"),
    UseGuards(AuthUserGuard),
    __param(0, Param("id")),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getById", null);
__decorate([
    Post(),
    UseGuards(AuthUserGuard),
    __param(0, Body()),
    __param(1, CurrentTenant("tenantId")),
    __param(2, CurrentOrg("orgId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "create", null);
__decorate([
    Patch(":id"),
    UseGuards(AuthUserGuard),
    __param(0, Param("id")),
    __param(1, Body()),
    __param(2, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "update", null);
__decorate([
    Delete(":id"),
    UseGuards(AuthUserGuard),
    __param(0, Param("id")),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "delete", null);
SessionsController = __decorate([
    Controller("sessions"),
    __param(0, Inject(SessionsService)),
    __param(1, Inject(EntitlementsEnforcementService)),
    __metadata("design:paramtypes", [SessionsService,
        EntitlementsEnforcementService])
], SessionsController);
export { SessionsController };
