var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { ForbiddenException, Injectable } from "@nestjs/common";
import { EntitlementsService } from "./entitlements.service";
export const AV30_SOFT_CAP_RATIO = 1.0;
export const AV30_GRACE_RATIO = 1.1;
export const AV30_HARD_CAP_RATIO = 1.2;
export const AV30_GRACE_DAYS = 14; // TODO: confirm exact business-configurable grace window
export class Av30HardCapExceededError extends ForbiddenException {
    code = "av30.hard_cap";
    constructor(orgId) {
        super({
            code: "av30.hard_cap",
            message: "AV30 hard cap reached; action blocked",
            orgId,
        });
    }
}
let EntitlementsEnforcementService = class EntitlementsEnforcementService {
    entitlements;
    constructor(entitlements) {
        this.entitlements = entitlements;
    }
    async checkAv30ForOrg(orgId) {
        const resolved = await this.entitlements.resolve(orgId);
        const cap = resolved.av30Cap;
        const usage = resolved.currentAv30 ?? 0;
        if (!cap || cap <= 0) {
            return {
                orgId,
                currentAv30: usage,
                av30Cap: cap,
                status: "OK",
                graceUntil: null,
                messageCode: "av30.no_cap",
            };
        }
        const ratio = usage / cap;
        if (ratio >= AV30_HARD_CAP_RATIO) {
            return {
                orgId,
                currentAv30: usage,
                av30Cap: cap,
                status: "HARD_CAP",
                graceUntil: null,
                messageCode: "av30.hard_cap",
            };
        }
        if (ratio >= AV30_GRACE_RATIO) {
            return {
                orgId,
                currentAv30: usage,
                av30Cap: cap,
                status: "GRACE",
                graceUntil: this.calculateGraceUntil(resolved.usageCalculatedAt),
                messageCode: "av30.grace",
            };
        }
        if (ratio >= AV30_SOFT_CAP_RATIO) {
            return {
                orgId,
                currentAv30: usage,
                av30Cap: cap,
                status: "SOFT_CAP",
                graceUntil: null,
                messageCode: "av30.soft_cap",
            };
        }
        return {
            orgId,
            currentAv30: usage,
            av30Cap: cap,
            status: "OK",
            graceUntil: null,
            messageCode: "av30.ok",
        };
    }
    assertWithinHardCap(result) {
        if (result.status === "HARD_CAP") {
            throw new Av30HardCapExceededError(result.orgId);
        }
    }
    calculateGraceUntil(calculatedAt) {
        if (!calculatedAt)
            return null;
        const grace = new Date(calculatedAt);
        grace.setDate(grace.getDate() + AV30_GRACE_DAYS);
        return grace;
    }
};
EntitlementsEnforcementService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EntitlementsService])
], EntitlementsEnforcementService);
export { EntitlementsEnforcementService };
