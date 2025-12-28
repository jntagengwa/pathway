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
import { Body, Controller, Post, UseGuards, Inject, } from "@nestjs/common";
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested, IsUrl, } from "class-validator";
import { Type, Transform } from "class-transformer";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { BuyNowService } from "./buy-now.service";
class BuyNowPlanSelectionDto {
    planCode;
    av30AddonBlocks;
    extraSites;
    extraStorageGb;
    extraSmsMessages;
    extraLeaderSeats;
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], BuyNowPlanSelectionDto.prototype, "planCode", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], BuyNowPlanSelectionDto.prototype, "av30AddonBlocks", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], BuyNowPlanSelectionDto.prototype, "extraSites", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], BuyNowPlanSelectionDto.prototype, "extraStorageGb", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], BuyNowPlanSelectionDto.prototype, "extraSmsMessages", void 0);
__decorate([
    IsOptional(),
    IsInt(),
    Min(0),
    __metadata("design:type", Number)
], BuyNowPlanSelectionDto.prototype, "extraLeaderSeats", void 0);
class BuyNowOrgDetailsDto {
    orgName;
    contactName;
    contactEmail;
    source;
}
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], BuyNowOrgDetailsDto.prototype, "orgName", void 0);
__decorate([
    IsString(),
    IsNotEmpty(),
    __metadata("design:type", String)
], BuyNowOrgDetailsDto.prototype, "contactName", void 0);
__decorate([
    IsEmail(),
    __metadata("design:type", String)
], BuyNowOrgDetailsDto.prototype, "contactEmail", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], BuyNowOrgDetailsDto.prototype, "source", void 0);
class BuyNowCheckoutRequestDto {
    plan;
    org;
    successUrl;
    cancelUrl;
}
__decorate([
    ValidateNested(),
    Type(() => BuyNowPlanSelectionDto),
    __metadata("design:type", BuyNowPlanSelectionDto)
], BuyNowCheckoutRequestDto.prototype, "plan", void 0);
__decorate([
    ValidateNested(),
    Type(() => BuyNowOrgDetailsDto),
    __metadata("design:type", BuyNowOrgDetailsDto)
], BuyNowCheckoutRequestDto.prototype, "org", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => (value === "" ? undefined : value)),
    IsUrl(),
    __metadata("design:type", String)
], BuyNowCheckoutRequestDto.prototype, "successUrl", void 0);
__decorate([
    IsOptional(),
    Transform(({ value }) => (value === "" ? undefined : value)),
    IsUrl(),
    __metadata("design:type", String)
], BuyNowCheckoutRequestDto.prototype, "cancelUrl", void 0);
let BuyNowController = class BuyNowController {
    buyNowService;
    constructor(buyNowService) {
        this.buyNowService = buyNowService;
    }
    async checkout(body) {
        return this.buyNowService.checkout(body);
    }
};
__decorate([
    Post("checkout"),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BuyNowCheckoutRequestDto]),
    __metadata("design:returntype", Promise)
], BuyNowController.prototype, "checkout", null);
BuyNowController = __decorate([
    UseGuards(AuthUserGuard),
    Controller("billing/buy-now"),
    __param(0, Inject(BuyNowService)),
    __metadata("design:paramtypes", [BuyNowService])
], BuyNowController);
export { BuyNowController };
