var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from "@nestjs/common";
/**
 * Minimal stub provider. Replace with a real Stripe adapter later.
 * Never handles raw card data; only opaque IDs/tokens from the client.
 */
class StripeStubAdapter {
    async checkout(input) {
        const fakeId = `sess_${Math.random().toString(36).slice(2, 10)}`;
        // Build a safe redirect URL derived from successUrl
        const url = new URL(input.successUrl);
        url.searchParams.set("session", fakeId);
        url.searchParams.set("provider", "stripe");
        url.searchParams.set("mode", input.mode ?? "subscription");
        // In a real adapter, you'd call Stripe's SDK here and capture:
        // - sessionId
        // - (optionally) customerId
        // - (optionally) subscriptionId
        return {
            provider: "stripe",
            checkoutUrl: url.toString(),
            sessionId: fakeId,
            planCode: input.planCode,
            mode: input.mode ?? "subscription",
        };
    }
}
let BillingService = class BillingService {
    // For MVP we keep an internal stub. Later we can inject a real adapter via module providers.
    provider = new StripeStubAdapter();
    /**
     * Create a hosted checkout (or setup) session with the billing provider.
     * Returns a redirect URL and session id to continue the flow on the client.
     *
     * Security:
     * - Never log or return secrets; we only accept opaque tokens/ids.
     * - Provider credentials are handled inside the adapter via env variables (once implemented).
     */
    async checkout(input) {
        // Basic invariant: orgId is a UUID (enforced by DTO), URLs are validated in DTO.
        // Any provider-specific mapping is done in the adapter.
        return this.provider.checkout(input);
    }
};
BillingService = __decorate([
    Injectable()
], BillingService);
export { BillingService };
