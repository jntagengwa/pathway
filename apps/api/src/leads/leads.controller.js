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
import { Controller, Post, Body, BadRequestException, HttpCode, HttpStatus, Inject, } from "@nestjs/common";
import { LeadsService } from "./leads.service";
import { createDemoLeadDto, createToolkitLeadDto, createTrialLeadDto, } from "./dto/create-lead.dto";
let LeadsController = class LeadsController {
    leadsService;
    constructor(leadsService) {
        this.leadsService = leadsService;
    }
    async createDemoLead(dto) {
        const parsed = createDemoLeadDto.safeParse(dto);
        if (!parsed.success) {
            throw new BadRequestException(parsed.error.errors);
        }
        const lead = await this.leadsService.createDemoLead(parsed.data);
        return { success: true, id: lead.id };
    }
    async createToolkitLead(dto) {
        const parsed = createToolkitLeadDto.safeParse(dto);
        if (!parsed.success) {
            throw new BadRequestException(parsed.error.errors);
        }
        const lead = await this.leadsService.createToolkitLead(parsed.data);
        return { success: true, id: lead.id };
    }
    async createTrialLead(dto) {
        const parsed = createTrialLeadDto.safeParse(dto);
        if (!parsed.success) {
            throw new BadRequestException(parsed.error.errors);
        }
        const lead = await this.leadsService.createTrialLead(parsed.data);
        return { success: true, id: lead.id };
    }
};
__decorate([
    Post("demo"),
    HttpCode(HttpStatus.OK),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "createDemoLead", null);
__decorate([
    Post("toolkit"),
    HttpCode(HttpStatus.OK),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "createToolkitLead", null);
__decorate([
    Post("trial"),
    HttpCode(HttpStatus.OK),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LeadsController.prototype, "createTrialLead", null);
LeadsController = __decorate([
    Controller("leads"),
    __param(0, Inject(LeadsService)),
    __metadata("design:paramtypes", [LeadsService])
], LeadsController);
export { LeadsController };
