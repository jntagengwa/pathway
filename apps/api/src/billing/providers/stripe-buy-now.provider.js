var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var StripeBuyNowProvider_1;
import Stripe from "stripe";
import { Injectable, Logger } from "@nestjs/common";
import { BuyNowProvider, } from "../buy-now.provider";
let StripeBuyNowProvider = StripeBuyNowProvider_1 = class StripeBuyNowProvider extends BuyNowProvider {
    config;
    stripe;
    logger = new Logger(StripeBuyNowProvider_1.name);
    constructor(config) {
        super();
        this.config = config;
        if (!config.stripe.secretKey) {
            throw new Error("Stripe secret key is required for Stripe provider");
        }
        this.stripe = new Stripe(config.stripe.secretKey ?? "", {
            apiVersion: "2023-10-16",
        });
    }
    async createCheckoutSession(params, ctx) {
        const priceMap = this.config.stripe.priceMap ?? {};
        const planCode = params.plan.planCode;
        const priceId = priceMap[planCode];
        if (!priceId) {
            this.logger.warn(`Stripe priceId missing for planCode=${params.plan.planCode}; aborting checkout`);
            throw new Error("Price configuration missing for selected plan");
        }
        const successUrl = params.successUrl ?? this.config.stripe.successUrlDefault ?? "";
        const cancelUrl = params.cancelUrl ?? this.config.stripe.cancelUrlDefault ?? "";
        const session = await this.stripe.checkout.sessions.create({
            mode: "subscription",
            success_url: successUrl,
            cancel_url: cancelUrl,
            line_items: [{ price: priceId, quantity: 1 }],
            metadata: {
                pendingOrderId: params.pendingOrderId,
                tenantId: ctx.tenantId,
                orgId: ctx.orgId,
                planCode: params.plan.planCode,
                av30Cap: String(params.preview.av30Cap ?? ""),
                maxSites: String(params.preview.maxSites ?? ""),
            },
        });
        this.logger.log(`Created Stripe checkout session for plan ${params.plan.planCode} pendingOrder=${params.pendingOrderId}`);
        return {
            provider: "stripe",
            sessionId: session.id,
            sessionUrl: session.url ?? "",
        };
    }
};
StripeBuyNowProvider = StripeBuyNowProvider_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Object])
], StripeBuyNowProvider);
export { StripeBuyNowProvider };
