import { Test } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { BillingController } from "../billing.controller";
import { BillingService } from "../billing.service";
describe("BillingController", () => {
    let controller;
    let service;
    beforeAll(async () => {
        const module = await Test.createTestingModule({
            controllers: [BillingController],
            providers: [BillingService],
        }).compile();
        controller = module.get(BillingController);
        service = module.get(BillingService);
    });
    it("checkout() validates payload and forwards to service", async () => {
        const spy = jest.spyOn(service, "checkout").mockResolvedValue({
            provider: "stripe",
            checkoutUrl: "https://example.com/success?session=sess_123",
            sessionId: "sess_123",
            planCode: "starter",
            mode: "subscription",
        });
        const payload = {
            provider: "stripe",
            orgId: "11111111-1111-1111-1111-111111111111",
            planCode: "starter",
            successUrl: "https://example.com/success",
            cancelUrl: "https://example.com/cancel",
        };
        const res = await controller.checkout(payload);
        expect(spy).toHaveBeenCalledWith(expect.objectContaining(payload));
        expect(res.provider).toBe("stripe");
        expect(res.sessionId).toBe("sess_123");
    });
    it("checkout() throws 400 on invalid payload", async () => {
        await expect(controller.checkout({ planCode: "starter" })).rejects.toBeInstanceOf(BadRequestException);
    });
});
