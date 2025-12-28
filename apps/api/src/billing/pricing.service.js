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
var BillingPricingService_1;
import Stripe from "stripe";
import { Injectable, Logger } from "@nestjs/common";
import { BILLING_PROVIDER_CONFIG, } from "./billing-provider.config";
import { Inject } from "@nestjs/common";
let BillingPricingService = BillingPricingService_1 = class BillingPricingService {
    config;
    logger = new Logger(BillingPricingService_1.name);
    stripe;
    cache = null;
    cacheTtlMs = 5 * 60 * 1000; // 5 minutes
    constructor(config) {
        this.config = config;
        if (config.stripe.secretKey) {
            this.stripe = new Stripe(config.stripe.secretKey, {
                apiVersion: "2023-10-16",
            });
        }
        else {
            this.stripe = null;
        }
    }
    async listPrices(forceRefresh = false) {
        if (!forceRefresh && this.cache && !this.isExpired(this.cache.fetchedAt)) {
            return this.cache.data;
        }
        if (!this.stripe || !this.config.stripe.priceMap) {
            const data = {
                provider: "fake",
                prices: [],
                warnings: ["pricing_unavailable"],
            };
            this.setCache(data);
            return data;
        }
        const warnings = [];
        const prices = [];
        const entries = Object.entries(this.config.stripe.priceMap);
        for (const [code, priceId] of entries) {
            if (!priceId)
                continue;
            try {
                const price = await this.stripe.prices.retrieve(priceId, {
                    expand: ["product"],
                });
                const interval = price.recurring?.interval === "month" || price.recurring?.interval === "year"
                    ? price.recurring.interval
                    : null;
                const product = typeof price.product === "object" &&
                    price.product !== null &&
                    !("deleted" in price.product)
                    ? price.product
                    : null;
                prices.push({
                    code,
                    priceId,
                    currency: price.currency,
                    unitAmount: price.unit_amount ?? 0,
                    interval,
                    intervalCount: price.recurring?.interval_count ?? null,
                    productName: product?.name ?? null,
                    description: product?.description ?? null,
                });
            }
            catch (err) {
                warnings.push(`price_fetch_failed:${code}`);
                this.logger.warn(`Failed to retrieve Stripe price for code ${code}: ${err instanceof Error ? err.message : String(err)}`);
            }
        }
        const data = {
            provider: "stripe",
            prices,
            warnings: warnings.length ? warnings : undefined,
        };
        this.setCache(data);
        return data;
    }
    isExpired(fetchedAt) {
        return Date.now() - fetchedAt > this.cacheTtlMs;
    }
    setCache(data) {
        this.cache = { fetchedAt: Date.now(), data };
    }
};
BillingPricingService = BillingPricingService_1 = __decorate([
    Injectable(),
    __param(0, Inject(BILLING_PROVIDER_CONFIG)),
    __metadata("design:paramtypes", [Object])
], BillingPricingService);
export { BillingPricingService };
