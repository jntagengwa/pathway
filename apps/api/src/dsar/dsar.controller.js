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
import { Controller, Get, Param, UseGuards, BadRequestException, Inject, } from "@nestjs/common";
import { z } from "zod";
import { CurrentTenant, UserOrgRole, UserTenantRole } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { SafeguardingGuard } from "../common/safeguarding/safeguarding.guard";
import { AllowedSafeguardingRoles } from "../common/safeguarding/safeguarding.decorator";
import { DsarService } from "./dsar.service";
const childParam = z.object({ childId: z.string().uuid("childId must be a UUID") });
const dsarRoles = {
    tenantRoles: [UserTenantRole.ADMIN],
    orgRoles: [UserOrgRole.SAFEGUARDING_LEAD, UserOrgRole.ORG_ADMIN],
};
let DsarController = class DsarController {
    dsar;
    constructor(dsar) {
        this.dsar = dsar;
    }
    async exportChild(params, tenantId) {
        const { childId } = await parseOrThrow(childParam, params);
        return this.dsar.exportChild(childId, tenantId);
    }
};
__decorate([
    Get("child/:childId"),
    AllowedSafeguardingRoles(dsarRoles),
    __param(0, Param()),
    __param(1, CurrentTenant("tenantId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DsarController.prototype, "exportChild", null);
DsarController = __decorate([
    UseGuards(AuthUserGuard, SafeguardingGuard),
    Controller("internal/dsar"),
    __param(0, Inject(DsarService)),
    __metadata("design:paramtypes", [DsarService])
], DsarController);
export { DsarController };
async function parseOrThrow(schema, data) {
    try {
        return await schema.parseAsync(data);
    }
    catch (e) {
        if (e instanceof z.ZodError) {
            throw new BadRequestException(e.flatten());
        }
        throw e;
    }
}
