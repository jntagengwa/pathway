var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, BadRequestException } from "@nestjs/common";
import { BillingProvider } from "@pathway/db";
let GoCardlessBillingWebhookProvider = class GoCardlessBillingWebhookProvider {
    config;
    constructor(config) {
        this.config = config;
    }
    async verifyAndParse(body, signature) {
        // TODO: implement GoCardless webhook signature verification (linear HMAC).
        if (!signature && process.env.NODE_ENV === "production") {
            throw new BadRequestException("Missing GoCardless signature");
        }
        const payload = typeof body === "string" ? safeParse(body) : body;
        if (!payload || typeof payload !== "object") {
            throw new BadRequestException("Invalid GoCardless payload");
        }
        // For now, map minimal fields; unknown events are ignored by controller.
        return {
            provider: BillingProvider.GOCARDLESS,
            eventId: String(payload.id ?? ""),
            kind: "unknown",
            orgId: "",
            subscriptionId: "",
        };
    }
};
GoCardlessBillingWebhookProvider = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Object])
], GoCardlessBillingWebhookProvider);
export { GoCardlessBillingWebhookProvider };
const safeParse = (raw) => {
    try {
        return JSON.parse(raw);
    }
    catch {
        return {};
    }
};
