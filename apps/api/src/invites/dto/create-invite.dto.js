var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { IsEmail, IsEnum, IsOptional, IsArray, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { OrgRole, SiteRole } from "@pathway/db";
class SiteAccessDto {
    mode;
    siteIds;
    role;
}
__decorate([
    IsEnum(["ALL_SITES", "SELECT_SITES"]),
    __metadata("design:type", String)
], SiteAccessDto.prototype, "mode", void 0);
__decorate([
    IsOptional(),
    IsArray(),
    IsString({ each: true }),
    __metadata("design:type", Array)
], SiteAccessDto.prototype, "siteIds", void 0);
__decorate([
    IsEnum(SiteRole),
    __metadata("design:type", String)
], SiteAccessDto.prototype, "role", void 0);
export class CreateInviteDto {
    email;
    name;
    orgRole;
    siteAccess;
}
__decorate([
    IsEmail(),
    __metadata("design:type", String)
], CreateInviteDto.prototype, "email", void 0);
__decorate([
    IsOptional(),
    IsString(),
    __metadata("design:type", String)
], CreateInviteDto.prototype, "name", void 0);
__decorate([
    IsOptional(),
    IsEnum(OrgRole),
    __metadata("design:type", String)
], CreateInviteDto.prototype, "orgRole", void 0);
__decorate([
    IsOptional(),
    ValidateNested(),
    Type(() => SiteAccessDto),
    __metadata("design:type", SiteAccessDto)
], CreateInviteDto.prototype, "siteAccess", void 0);
