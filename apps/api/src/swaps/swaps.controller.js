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
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, BadRequestException, UseGuards, Inject, } from "@nestjs/common";
import { z } from "zod";
import { SwapsService } from "./swaps.service";
import { createSwapDto, updateSwapDto } from "./dto";
import { SwapStatus } from "@pathway/db";
import { CurrentTenant } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
const idParamSchema = z
    .string({ required_error: "id is required" })
    .uuid("id must be a valid uuid");
const listQueryDto = z.object({
    assignmentId: z.string().uuid().optional(),
    fromUserId: z.string().uuid().optional(),
    toUserId: z.string().uuid().optional(),
    status: z.nativeEnum(SwapStatus).optional(),
});
let SwapsController = class SwapsController {
    swaps;
    constructor(swaps) {
        this.swaps = swaps;
    }
    async create(body, tenantId) {
        const parsed = createSwapDto.safeParse(body);
        if (!parsed.success) {
            throw new BadRequestException(parsed.error.issues);
        }
        const dto = parsed.data;
        return this.swaps.create(dto, tenantId);
    }
    async findAll(query, tenantId) {
        const parsed = listQueryDto.safeParse(query);
        if (!parsed.success) {
            throw new BadRequestException(parsed.error.issues);
        }
        const filters = parsed.data;
        return this.swaps.findAll({ ...filters, tenantId });
    }
    async findOne(id, tenantId) {
        const parsed = idParamSchema.safeParse(id);
        if (!parsed.success) {
            throw new BadRequestException(parsed.error.issues);
        }
        const validId = parsed.data;
        return this.swaps.findOne(validId, tenantId);
    }
    async update(id, body, tenantId) {
        const parsedId = idParamSchema.safeParse(id);
        if (!parsedId.success) {
            throw new BadRequestException(parsedId.error.issues);
        }
        const validId = parsedId.data;
        const parsedBody = updateSwapDto.safeParse(body);
        if (!parsedBody.success) {
            throw new BadRequestException(parsedBody.error.issues);
        }
        const dto = parsedBody.data;
        return this.swaps.update(validId, dto, tenantId);
    }
    async remove(id, tenantId) {
        const parsed = idParamSchema.safeParse(id);
        if (!parsed.success) {
            throw new BadRequestException(parsed.error.issues);
        }
        const validId = parsed.data;
        return this.swaps.remove(validId, tenantId);
    }
};
__decorate([
    Post(),
    __param(0, Body()),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SwapsController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, Query()),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SwapsController.prototype, "findAll", null);
__decorate([
    Get(":id"),
    __param(0, Param("id")),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SwapsController.prototype, "findOne", null);
__decorate([
    Patch(":id"),
    __param(0, Param("id")),
    __param(1, Body()),
    __param(2, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], SwapsController.prototype, "update", null);
__decorate([
    Delete(":id"),
    __param(0, Param("id")),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SwapsController.prototype, "remove", null);
SwapsController = __decorate([
    Controller("swaps"),
    UseGuards(AuthUserGuard),
    __param(0, Inject(SwapsService)),
    __metadata("design:paramtypes", [SwapsService])
], SwapsController);
export { SwapsController };
