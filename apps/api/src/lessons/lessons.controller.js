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
import { z, ZodError } from "zod";
import { LessonsService } from "./lessons.service";
import { createLessonDto, updateLessonDto } from "./dto";
import { CurrentTenant } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
// Simple UUID validator for path params
const idParam = z
    .string({ required_error: "id is required" })
    .uuid("id must be a valid uuid");
// Optional filters for list
// TODO(Epic1-Task1.3): once PathwayRequestContext is globally enforced, drop the tenantId query param
// and rely on @CurrentTenant() to keep handlers multi-tenant safe by default.
const listQuery = z
    .object({
    groupId: z.string().uuid().optional(),
    weekOf: z.coerce.date().optional(),
})
    .strict();
let LessonsController = class LessonsController {
    lessons;
    constructor(lessons) {
        this.lessons = lessons;
    }
    async create(body, tenantId) {
        try {
            const dto = await createLessonDto.parseAsync(body);
            if (dto.tenantId !== tenantId) {
                throw new BadRequestException("tenantId must match current tenant");
            }
            return await this.lessons.create(dto, tenantId);
        }
        catch (e) {
            if (e instanceof ZodError)
                throw new BadRequestException(e.errors);
            throw e;
        }
    }
    async findAll(query, tenantId) {
        try {
            const filters = await listQuery.parseAsync(query);
            return await this.lessons.findAll({ ...filters, tenantId });
        }
        catch (e) {
            if (e instanceof ZodError)
                throw new BadRequestException(e.errors);
            throw e;
        }
    }
    async findOne(idRaw, tenantId) {
        try {
            const id = idParam.parse(idRaw);
            return await this.lessons.findOne(id, tenantId);
        }
        catch (e) {
            if (e instanceof ZodError)
                throw new BadRequestException(e.errors);
            throw e;
        }
    }
    async update(idRaw, body, tenantId) {
        try {
            const id = idParam.parse(idRaw);
            const dto = await updateLessonDto.parseAsync(body);
            return await this.lessons.update(id, dto, tenantId);
        }
        catch (e) {
            if (e instanceof ZodError)
                throw new BadRequestException(e.errors);
            throw e;
        }
    }
    async remove(idRaw, tenantId) {
        try {
            const id = idParam.parse(idRaw);
            return await this.lessons.remove(id, tenantId);
        }
        catch (e) {
            if (e instanceof ZodError)
                throw new BadRequestException(e.errors);
            throw e;
        }
    }
};
__decorate([
    Post(),
    __param(0, Body()),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, Query()),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "findAll", null);
__decorate([
    Get(":id"),
    __param(0, Param("id")),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "findOne", null);
__decorate([
    Patch(":id"),
    __param(0, Param("id")),
    __param(1, Body()),
    __param(2, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "update", null);
__decorate([
    Delete(":id"),
    __param(0, Param("id")),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "remove", null);
LessonsController = __decorate([
    UseGuards(AuthUserGuard),
    Controller("lessons"),
    __param(0, Inject(LessonsService)),
    __metadata("design:paramtypes", [LessonsService])
], LessonsController);
export { LessonsController };
