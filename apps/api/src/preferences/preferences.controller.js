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
import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Inject, } from "@nestjs/common";
import { CurrentTenant } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { PreferencesService } from "./preferences.service";
import { createVolunteerPreferenceDto, updateVolunteerPreferenceDto, idParamDto, } from "./dto";
// Convert Zod validation failures into HTTP 400 instead of 500
function zParseOrBadRequest(schema, input) {
    const result = schema.safeParse(input);
    if (!result.success) {
        throw new BadRequestException(result.error.issues);
    }
    return result.data;
}
let PreferencesController = class PreferencesController {
    preferencesService;
    constructor(preferencesService) {
        this.preferencesService = preferencesService;
    }
    async create(body, tenantId) {
        const dto = zParseOrBadRequest(createVolunteerPreferenceDto, body);
        return this.preferencesService.create({ ...dto, tenantId }, tenantId);
    }
    async findAll(tenantId) {
        return this.preferencesService.findAll({ tenantId });
    }
    async findOne(params, tenantId) {
        const { id } = zParseOrBadRequest(idParamDto, params);
        return this.preferencesService.findOne(id, tenantId);
    }
    async update(params, body, tenantId) {
        const { id } = zParseOrBadRequest(idParamDto, params);
        const dto = zParseOrBadRequest(updateVolunteerPreferenceDto, body);
        return this.preferencesService.update(id, dto, tenantId);
    }
    async remove(params, tenantId) {
        const { id } = zParseOrBadRequest(idParamDto, params);
        return this.preferencesService.remove(id, tenantId);
    }
};
__decorate([
    Post(),
    __param(0, Body()),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PreferencesController.prototype, "create", null);
__decorate([
    Get(),
    __param(0, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PreferencesController.prototype, "findAll", null);
__decorate([
    Get(":id"),
    __param(0, Param()),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PreferencesController.prototype, "findOne", null);
__decorate([
    Patch(":id"),
    __param(0, Param()),
    __param(1, Body()),
    __param(2, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], PreferencesController.prototype, "update", null);
__decorate([
    Delete(":id"),
    __param(0, Param()),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PreferencesController.prototype, "remove", null);
PreferencesController = __decorate([
    Controller("preferences"),
    UseGuards(AuthUserGuard),
    __param(0, Inject(PreferencesService)),
    __metadata("design:paramtypes", [PreferencesService])
], PreferencesController);
export { PreferencesController };
