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
import { Controller, Get, Query, UseGuards, Inject } from "@nestjs/common";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { BillingPricingService } from "./pricing.service";
let BillingPricingController = class BillingPricingController {
    pricing;
    constructor(pricing) {
        this.pricing = pricing;
    }
    async list(refresh) {
        const force = refresh === "true";
        return this.pricing.listPrices(force);
    }
};
__decorate([
    Get(),
    __param(0, Query("refresh")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BillingPricingController.prototype, "list", null);
BillingPricingController = __decorate([
    UseGuards(AuthUserGuard),
    Controller("billing/prices"),
    __param(0, Inject(BillingPricingService)),
    __metadata("design:paramtypes", [BillingPricingService])
], BillingPricingController);
export { BillingPricingController };
