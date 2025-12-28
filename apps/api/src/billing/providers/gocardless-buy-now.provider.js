var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GoCardlessBuyNowProvider_1;
import { Injectable, Logger } from "@nestjs/common";
import { BuyNowProvider, } from "../buy-now.provider";
let GoCardlessBuyNowProvider = GoCardlessBuyNowProvider_1 = class GoCardlessBuyNowProvider extends BuyNowProvider {
    config;
    logger = new Logger(GoCardlessBuyNowProvider_1.name);
    constructor(config) {
        super();
        this.config = config;
    }
    async createCheckoutSession(params, _ctx) {
        void _ctx;
        // TODO: Implement real GoCardless redirect flow creation.
        const sessionId = `gocardless_${Date.now()}`;
        const redirectUrl = this.config.goCardless.successUrlDefault ??
            "https://pay-sandbox.gocardless.com/redirect-flow-placeholder";
        this.logger.log(`Created GoCardless placeholder checkout for plan ${params.plan.planCode} pendingOrder=${params.pendingOrderId}`);
        return {
            provider: "gocardless",
            sessionId,
            sessionUrl: redirectUrl,
        };
    }
};
GoCardlessBuyNowProvider = GoCardlessBuyNowProvider_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Object])
], GoCardlessBuyNowProvider);
export { GoCardlessBuyNowProvider };
