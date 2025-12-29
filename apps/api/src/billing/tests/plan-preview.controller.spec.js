import { Test } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { PathwayAuthGuard } from "@pathway/auth";
import { PlanPreviewController } from "../plan-preview.controller";
import { PlanPreviewService } from "../plan-preview.service";
describe("PlanPreviewController", () => {
    let controller;
    const previewMock = jest.fn();
    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [PlanPreviewController],
            providers: [{ provide: PlanPreviewService, useValue: { preview: previewMock } }],
        })
            .overrideGuard(PathwayAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();
        controller = module.get(PlanPreviewController);
        previewMock.mockReset();
    });
    it("delegates to service with trimmed plan code", () => {
        const response = {
            planCode: "STARTER_MONTHLY",
            planTier: "starter",
            displayName: "Starter",
            billingPeriod: "monthly",
            selfServe: true,
            base: {
                av30Cap: 50,
                storageGbCap: null,
                smsMessagesCap: null,
                leaderSeatsIncluded: null,
                maxSites: 1,
            },
            addons: {
                av30Cap: null,
                storageGbCap: null,
                smsMessagesCap: null,
                leaderSeatsIncluded: null,
                maxSites: null,
                extraAv30Blocks: null,
            },
            effectiveCaps: {
                av30Cap: 50,
                storageGbCap: null,
                smsMessagesCap: null,
                leaderSeatsIncluded: null,
                maxSites: 1,
            },
            notes: { source: "plan_catalogue", warnings: [] },
        };
        previewMock.mockReturnValue(response);
        const body = {
            planCode: " STARTER_MONTHLY ",
            addons: { extraAv30Blocks: 1 },
        };
        const result = controller.preview(body);
        expect(previewMock).toHaveBeenCalledWith({
            planCode: "STARTER_MONTHLY",
            addons: body.addons,
        });
        expect(result).toBe(response);
    });
    it("throws on missing planCode", () => {
        expect(() => controller.preview({})).toThrow(BadRequestException);
    });
    it("throws on non-numeric add-on fields", () => {
        expect(() => controller.preview({
            planCode: "GROWTH_MONTHLY",
            addons: { extraAv30Blocks: "2" },
        })).toThrow(BadRequestException);
    });
});
