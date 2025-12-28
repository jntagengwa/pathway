var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var FakeBuyNowProvider_1;
import { Injectable, Logger } from "@nestjs/common";
export class BuyNowProvider {
}
let FakeBuyNowProvider = FakeBuyNowProvider_1 = class FakeBuyNowProvider extends BuyNowProvider {
    logger = new Logger(FakeBuyNowProvider_1.name);
    async createCheckoutSession(params, _ctx) {
        void _ctx;
        const sessionId = `fake_${Date.now()}`;
        const sessionUrl = `https://example.test/checkout/${sessionId}`;
        this.logger.log(`Created fake checkout session for plan ${params.plan.planCode}`);
        return {
            provider: "fake",
            sessionId,
            sessionUrl,
        };
    }
};
FakeBuyNowProvider = FakeBuyNowProvider_1 = __decorate([
    Injectable()
], FakeBuyNowProvider);
export { FakeBuyNowProvider };
