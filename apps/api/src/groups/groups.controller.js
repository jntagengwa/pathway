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
import { Controller, Get, Param, Post, Body, NotFoundException, Patch, BadRequestException, UseGuards, Inject, } from "@nestjs/common";
import { CurrentTenant } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { GroupsService } from "./groups.service";
import { createGroupDto } from "./dto/create-group.dto";
import { updateGroupDto } from "./dto/update-group.dto";
let GroupsController = class GroupsController {
    groupsService;
    constructor(groupsService) {
        this.groupsService = groupsService;
    }
    async list(tenantId) {
        return this.groupsService.list(tenantId);
    }
    async getById(id, tenantId) {
        const group = await this.groupsService.getById(id, tenantId);
        if (!group)
            throw new NotFoundException("Group not found");
        return group;
    }
    async create(dto, tenantId) {
        // Let the service handle normalization/validation; optional quick parse here for early 400s
        const parsed = createGroupDto.safeParse(dto);
        if (!parsed.success) {
            throw new BadRequestException(parsed.error.errors);
        }
        if (parsed.data.tenantId !== tenantId) {
            throw new BadRequestException("tenantId must match current tenant");
        }
        return this.groupsService.create({ ...parsed.data, tenantId }, tenantId);
    }
    async update(id, dto, tenantId) {
        const parsed = updateGroupDto.safeParse(dto);
        if (!parsed.success) {
            throw new BadRequestException(parsed.error.errors);
        }
        return this.groupsService.update(id, parsed.data, tenantId);
    }
};
__decorate([
    Get(),
    __param(0, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "list", null);
__decorate([
    Get(":id"),
    __param(0, Param("id")),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getById", null);
__decorate([
    Post(),
    __param(0, Body()),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "create", null);
__decorate([
    Patch(":id"),
    __param(0, Param("id")),
    __param(1, Body()),
    __param(2, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "update", null);
GroupsController = __decorate([
    UseGuards(AuthUserGuard),
    Controller("groups"),
    __param(0, Inject(GroupsService)),
    __metadata("design:paramtypes", [GroupsService])
], GroupsController);
export { GroupsController };
