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
import { Body, Controller, Headers, Post, UnauthorizedException, Inject, } from "@nestjs/common";
import { AuthIdentityService } from "./auth-identity.service";
import { UpsertIdentityDto } from "./dto/upsert-identity.dto";
const INTERNAL_SECRET_HEADER = "x-pathway-internal-secret";
let AuthIdentityController = class AuthIdentityController {
    authIdentityService;
    constructor(authIdentityService) {
        this.authIdentityService = authIdentityService;
    }
    async upsertIdentity(body, providedSecret) {
        const expectedSecret = process.env.INTERNAL_AUTH_SECRET;
        if (!expectedSecret || providedSecret !== expectedSecret) {
            throw new UnauthorizedException("Invalid internal auth secret");
        }
        const result = await this.authIdentityService.upsertFromAuth0(body);
        return result;
    }
};
__decorate([
    Post("upsert"),
    __param(0, Body()),
    __param(1, Headers(INTERNAL_SECRET_HEADER)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UpsertIdentityDto, String]),
    __metadata("design:returntype", Promise)
], AuthIdentityController.prototype, "upsertIdentity", null);
AuthIdentityController = __decorate([
    Controller("internal/auth/identity"),
    __param(0, Inject(AuthIdentityService)),
    __metadata("design:paramtypes", [AuthIdentityService])
], AuthIdentityController);
export { AuthIdentityController };
