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
import { Controller, Get, Param, Post, Body, BadRequestException, Inject, } from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { createTenantDto } from "./dto/create-tenant.dto";
let TenantsController = class TenantsController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    async list() {
        return this.svc.list();
    }
    async bySlug(slug) {
        return this.svc.getBySlug(slug);
    }
    async create(body) {
        const result = createTenantDto.safeParse(body);
        if (!result.success) {
            throw new BadRequestException(result.error.format());
        }
        return this.svc.create(result.data);
    }
};
__decorate([
    Get(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "list", null);
__decorate([
    Get(":slug"),
    __param(0, Param("slug")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "bySlug", null);
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TenantsController.prototype, "create", null);
TenantsController = __decorate([
    Controller("tenants"),
    __param(0, Inject(TenantsService)),
    __metadata("design:paramtypes", [TenantsService])
], TenantsController);
export { TenantsController };
