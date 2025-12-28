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
import { BadRequestException, Body, Controller, Post, Inject } from "@nestjs/common";
import { z } from "zod";
import { BillingService } from "./billing.service";
import { checkoutDto } from "./dto/checkout.dto";
const parseOrBadRequest = async (schema, data) => {
    try {
        return await schema.parseAsync(data);
    }
    catch (e) {
        if (e instanceof z.ZodError) {
            const flat = e.flatten();
            const fieldMessages = Object.entries(flat.fieldErrors).flatMap(([key, msgs]) => (msgs ?? []).map((m) => `${key}: ${m}`));
            const formMessages = flat.formErrors ?? [];
            const messages = [...formMessages, ...fieldMessages];
            throw new BadRequestException(messages.length ? messages : ["Invalid request body"]);
        }
        throw e;
    }
};
let BillingController = class BillingController {
    service;
    constructor(service) {
        this.service = service;
    }
    async checkout(body) {
        const dto = await parseOrBadRequest(checkoutDto, body);
        return this.service.checkout(dto);
    }
};
__decorate([
    Post("checkout"),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "checkout", null);
BillingController = __decorate([
    Controller("billing"),
    __param(0, Inject(BillingService)),
    __metadata("design:paramtypes", [BillingService])
], BillingController);
export { BillingController };
