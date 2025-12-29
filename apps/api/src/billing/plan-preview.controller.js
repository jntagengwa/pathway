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
import { BadRequestException, Body, Controller, Post, UseGuards, Inject, } from "@nestjs/common";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { PlanPreviewService } from "./plan-preview.service";
let PlanPreviewController = class PlanPreviewController {
    planPreviewService;
    constructor(planPreviewService) {
        this.planPreviewService = planPreviewService;
    }
    preview(body) {
        const errors = [];
        const trimmedPlanCode = (body?.planCode ?? "").trim();
        if (!trimmedPlanCode) {
            errors.push("planCode is required");
        }
        const addons = body?.addons;
        if (addons && typeof addons !== "object") {
            errors.push("addons must be an object when provided");
        }
        const validateNumber = (value, field) => {
            if (value === undefined || value === null)
                return;
            if (typeof value !== "number" || Number.isNaN(value)) {
                errors.push(`${field} must be a number`);
            }
        };
        if (addons && typeof addons === "object") {
            validateNumber(addons.extraAv30Blocks, "extraAv30Blocks");
            validateNumber(addons.extraStorageGb, "extraStorageGb");
            validateNumber(addons.extraSmsMessages, "extraSmsMessages");
            validateNumber(addons.extraLeaderSeats, "extraLeaderSeats");
            validateNumber(addons.extraSites, "extraSites");
        }
        if (errors.length) {
            throw new BadRequestException({
                error: "Invalid plan preview request",
                details: errors,
            });
        }
        return this.planPreviewService.preview({
            planCode: trimmedPlanCode,
            addons: body?.addons,
        });
    }
};
__decorate([
    Post(),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], PlanPreviewController.prototype, "preview", null);
PlanPreviewController = __decorate([
    UseGuards(AuthUserGuard),
    Controller("billing/plan-preview"),
    __param(0, Inject(PlanPreviewService)),
    __metadata("design:paramtypes", [PlanPreviewService])
], PlanPreviewController);
export { PlanPreviewController };
