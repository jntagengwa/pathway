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
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, BadRequestException, Inject, } from "@nestjs/common";
import { z } from "zod";
import { AnnouncementsService } from "./announcements.service";
import { createAnnouncementDto, updateAnnouncementDto } from "./dto";
import { CurrentTenant, CurrentOrg } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { EntitlementsEnforcementService } from "../billing/entitlements-enforcement.service";
const listQuery = z
    .object({
    audience: z.enum(["ALL", "PARENTS", "STAFF"]).optional(),
    publishedOnly: z.coerce.boolean().optional(),
})
    .strict();
const idParam = z.object({ id: z.string().uuid("id must be a valid UUID") });
let AnnouncementsController = class AnnouncementsController {
    service;
    enforcement;
    constructor(service, enforcement) {
        this.service = service;
        this.enforcement = enforcement;
    }
    async create(body, tenantId, orgId) {
        // Service will validate again, but we parse here to provide immediate 400s with clear messages
        const dto = await createAnnouncementDto.parseAsync(body);
        if (dto.tenantId !== tenantId) {
            throw new BadRequestException("tenantId must match current tenant");
        }
        const av30 = await this.enforcement.checkAv30ForOrg(orgId);
        this.enforcement.assertWithinHardCap(av30);
        // TODO(Epic4-UI): Surface av30 status in response metadata for warnings
        return this.service.create(dto, tenantId);
    }
    async findAll(query, tenantId) {
        const q = await listQuery.parseAsync(query);
        return this.service.findAll({
            tenantId,
            audience: q.audience,
            publishedOnly: q.publishedOnly ?? false,
        });
    }
    async findOne(params, tenantId) {
        const { id } = await idParam.parseAsync(params);
        return this.service.findOne(id, tenantId);
    }
    async update(params, body, tenantId, orgId) {
        const { id } = await idParam.parseAsync(params);
        const dto = await updateAnnouncementDto.parseAsync(body);
        // If publish-on-update, enforce AV30 hard cap; otherwise no-op
        if (dto.publishedAt) {
            const av30 = await this.enforcement.checkAv30ForOrg(orgId);
            this.enforcement.assertWithinHardCap(av30);
            // TODO(Epic4-UI): Surface av30 status in response metadata for warnings
        }
        return this.service.update(id, dto, tenantId);
    }
    async remove(params, tenantId) {
        const { id } = await idParam.parseAsync(params);
        return this.service.remove(id, tenantId);
    }
};
__decorate([
    Post(),
    UseGuards(AuthUserGuard),
    __param(0, Body()),
    __param(1, CurrentTenant("tenantId")),
    __param(2, CurrentOrg("orgId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], AnnouncementsController.prototype, "create", null);
__decorate([
    Get(),
    UseGuards(AuthUserGuard),
    __param(0, Query()),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AnnouncementsController.prototype, "findAll", null);
__decorate([
    Get(":id"),
    UseGuards(AuthUserGuard),
    __param(0, Param()),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AnnouncementsController.prototype, "findOne", null);
__decorate([
    Patch(":id"),
    UseGuards(AuthUserGuard),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentTenant("tenantId")),
    __param(3, CurrentOrg("orgId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AnnouncementsController.prototype, "update", null);
__decorate([
    Delete(":id"),
    UseGuards(AuthUserGuard),
    __param(0, Param()),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AnnouncementsController.prototype, "remove", null);
AnnouncementsController = __decorate([
    Controller("announcements"),
    __param(0, Inject(AnnouncementsService)),
    __param(1, Inject(EntitlementsEnforcementService)),
    __metadata("design:paramtypes", [AnnouncementsService,
        EntitlementsEnforcementService])
], AnnouncementsController);
export { AnnouncementsController };
