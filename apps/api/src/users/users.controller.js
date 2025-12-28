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
import { Controller, Get, Post, Patch, Param, Body, NotFoundException, BadRequestException, UseGuards, Inject, } from "@nestjs/common";
import { CurrentTenant, CurrentUser } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { UsersService } from "./users.service";
let UsersController = class UsersController {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    async list(tenantId) {
        return this.usersService.list(tenantId);
    }
    async getById(id, tenantId) {
        const user = await this.usersService.getById(id, tenantId);
        if (!user) {
            throw new NotFoundException("User not found");
        }
        return user;
    }
    async create(dto, tenantId) {
        if (dto.tenantId && dto.tenantId !== tenantId) {
            throw new BadRequestException("tenantId must match current tenant");
        }
        return this.usersService.create({ ...dto, tenantId });
    }
    async update(id, dto, tenantId) {
        if (dto.tenantId && dto.tenantId !== tenantId) {
            throw new BadRequestException("tenantId must match current tenant");
        }
        return this.usersService.update(id, { ...dto, tenantId });
    }
    async updateMe(dto, userId) {
        // For "me" endpoint, only allow updating name and displayName (not tenantId, email, etc.)
        const allowedFields = {};
        if (dto.name !== undefined)
            allowedFields.name = dto.name;
        if (dto.displayName !== undefined)
            allowedFields.displayName = dto.displayName;
        return this.usersService.update(userId, allowedFields);
    }
};
__decorate([
    Get(),
    __param(0, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "list", null);
__decorate([
    Get(":id"),
    __param(0, Param("id")),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getById", null);
__decorate([
    Post(),
    __param(0, Body()),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    Patch(":id"),
    __param(0, Param("id")),
    __param(1, Body()),
    __param(2, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    Patch("me"),
    __param(0, Body()),
    __param(1, CurrentUser("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateMe", null);
UsersController = __decorate([
    UseGuards(AuthUserGuard),
    Controller("users"),
    __param(0, Inject(UsersService)),
    __metadata("design:paramtypes", [UsersService])
], UsersController);
export { UsersController };
