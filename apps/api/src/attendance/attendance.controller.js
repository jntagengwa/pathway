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
import { AttendanceService } from "./attendance.service";
import { createAttendanceDto, } from "./dto/create-attendance.dto";
import { updateAttendanceDto, } from "./dto/update-attendance.dto";
import { CurrentTenant } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
let AttendanceController = class AttendanceController {
    attendanceService;
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    async list(tenantId) {
        return this.attendanceService.list(tenantId);
    }
    async getById(id, tenantId) {
        return this.attendanceService.getById(id, tenantId);
    }
    async create(body, tenantId) {
        const parsed = createAttendanceDto.safeParse(body);
        if (!parsed.success) {
            throw new BadRequestException(parsed.error.format());
        }
        return this.attendanceService.create(parsed.data, tenantId);
    }
    async update(id, body, tenantId) {
        const parsed = updateAttendanceDto.safeParse(body);
        if (!parsed.success) {
            throw new BadRequestException(parsed.error.format());
        }
        return this.attendanceService.update(id, parsed.data, tenantId);
    }
};
__decorate([
    Get(),
    __param(0, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "list", null);
__decorate([
    Get(":id"),
    __param(0, Param("id")),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getById", null);
__decorate([
    Post(),
    __param(0, Body()),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "create", null);
__decorate([
    Patch(":id"),
    __param(0, Param("id")),
    __param(1, Body()),
    __param(2, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "update", null);
AttendanceController = __decorate([
    UseGuards(AuthUserGuard),
    Controller("attendance"),
    __param(0, Inject(AttendanceService)),
    __metadata("design:paramtypes", [AttendanceService])
], AttendanceController);
export { AttendanceController };
