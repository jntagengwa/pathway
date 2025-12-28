import { Test } from "@nestjs/testing";
import { OrgsController } from "../orgs.controller";
import { OrgsService } from "../orgs.service";
import { PathwayAuthGuard } from "@pathway/auth";
describe("OrgsController", () => {
    let controller;
    // Create a strictly-typed mock for OrgsService.register using the real signature
    const registerMock = jest.fn();
    const mockOrgsService = {
        register: registerMock,
    };
    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [OrgsController],
            providers: [{ provide: OrgsService, useValue: mockOrgsService }],
        })
            .overrideGuard(PathwayAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();
        controller = module.get(OrgsController);
        registerMock.mockReset();
    });
    it("should delegate to OrgsService.register and return the created org", async () => {
        const payload = {
            org: {
                name: "Acme Church",
                slug: "acme-church",
                planCode: "STARTER",
                isSuite: true,
            },
            initialTenant: { create: false },
            admin: { email: "admin@acme.test", fullName: "Admin User" },
        };
        const result = {
            org: {
                id: "11111111-2222-3333-4444-555555555555",
                name: "Acme Church",
                slug: "acme-church",
                planCode: "STARTER",
            },
        };
        // Configure mock and execute
        registerMock.mockResolvedValue(result);
        const res = await controller.register(payload);
        expect(registerMock).toHaveBeenCalledTimes(1);
        expect(registerMock).toHaveBeenCalledWith(expect.objectContaining({
            org: expect.objectContaining({
                name: "Acme Church",
                slug: "acme-church",
                // `planCode` is transformed by the DTO (e.g., to "trial"), so we don't assert its exact value here.
                isSuite: true,
            }),
            initialTenant: expect.objectContaining({ create: false }),
            admin: expect.objectContaining({
                email: "admin@acme.test",
                fullName: "Admin User",
            }),
        }));
        expect(res).toEqual(result);
    });
    it("should surface errors thrown by the service", async () => {
        const payload = {
            org: {
                name: "Bad Org",
                slug: "bad-org",
                planCode: "STARTER",
                isSuite: true,
            },
            initialTenant: { create: false },
            admin: { email: "admin@acme.test", fullName: "Admin User" },
        };
        const err = new Error("failed to register");
        registerMock.mockRejectedValue(err);
        await expect(controller.register(payload)).rejects.toThrow("failed to register");
        expect(registerMock).toHaveBeenCalledTimes(1);
    });
});
