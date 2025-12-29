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
import { Controller, Get, Post, Patch, Param, Body, BadRequestException, UseGuards, Inject, } from "@nestjs/common";
import { CurrentTenant } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { ChildrenService } from "./children.service";
import { createChildSchema } from "./dto/create-child.dto";
import { updateChildSchema } from "./dto/update-child.dto";
let ChildrenController = class ChildrenController {
    childrenService;
    constructor(childrenService) {
        this.childrenService = childrenService;
    }
    async list(tenantId) {
        return this.childrenService.list(tenantId);
    }
    async getById(id, tenantId) {
        return this.childrenService.getById(id, tenantId);
    }
    async create(body, tenantId) {
        const parsed = createChildSchema.safeParse(body);
        if (!parsed.success) {
            throw new BadRequestException(parsed.error.format());
        }
        return this.childrenService.create(parsed.data, tenantId);
    }
    async update(id, body, tenantId) {
        const parsed = updateChildSchema.safeParse(body);
        if (!parsed.success) {
            throw new BadRequestException(parsed.error.format());
        }
        return this.childrenService.update(id, parsed.data, tenantId);
    }
};
__decorate([
    Get(),
    __param(0, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChildrenController.prototype, "list", null);
__decorate([
    Get(":id"),
    __param(0, Param("id")),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChildrenController.prototype, "getById", null);
__decorate([
    Post(),
    __param(0, Body()),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ChildrenController.prototype, "create", null);
__decorate([
    Patch(":id"),
    __param(0, Param("id")),
    __param(1, Body()),
    __param(2, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], ChildrenController.prototype, "update", null);
ChildrenController = __decorate([
    Controller("children"),
    UseGuards(AuthUserGuard),
    __param(0, Inject(ChildrenService)),
    __metadata("design:paramtypes", [ChildrenService])
], ChildrenController);
export { ChildrenController };
