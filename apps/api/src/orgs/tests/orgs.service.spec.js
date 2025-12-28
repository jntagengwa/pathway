import { Test } from "@nestjs/testing";
import { OrgsService } from "../orgs.service";
import { BillingService } from "../../billing/billing.service";
import { LoggingService } from "../../common/logging/logging.service";
// ---- Mock Prisma from @pathway/db -----------------------------------------
// We mock the exported `prisma` singleton that OrgsService relies on.
const prismaMock = {
    org: {
        create: jest.fn(),
        findUnique: jest.fn(),
    },
    tenant: {
        create: jest.fn(),
    },
    user: {
        create: jest.fn(),
    },
    $transaction: jest.fn(async (cb) => cb(prismaMock)),
};
jest.mock("@pathway/db", () => ({
    get prisma() {
        return prismaMock;
    },
}));
// ---------------------------------------------------------------------------
describe("OrgsService", () => {
    let service;
    const mockBilling = {
        checkout: jest.fn(async (input) => ({
            // Echo back required inputs so the shape matches CheckoutResult
            provider: input.provider,
            planCode: input.planCode,
            mode: input.mode,
            seats: input.seats,
            successUrl: input.successUrl,
            cancelUrl: input.cancelUrl,
            // Typical results a real provider would return
            subscriptionId: "sub_test_123",
            customerId: input.customerId ?? "cus_test_123",
            clientSecret: "cs_test",
            status: "active",
        })),
    };
    beforeEach(async () => {
        jest.clearAllMocks();
        const module = await Test.createTestingModule({
            providers: [
                OrgsService,
                { provide: BillingService, useValue: mockBilling },
                LoggingService,
            ],
        }).compile();
        service = module.get(OrgsService);
    });
    it("should be defined", () => {
        expect(service).toBeDefined();
    });
    describe("register", () => {
        const baseOrg = {
            id: "org_1",
            name: "Acme Church",
            slug: "acme-church",
        };
        it("creates an org without calling billing when billing is omitted", async () => {
            prismaMock.org.create.mockResolvedValue(baseOrg);
            const dto = {
                org: { name: baseOrg.name, slug: baseOrg.slug },
                admin: { email: "admin@acme.test", fullName: "Admin User" },
                initialTenant: { create: true, name: "Kids", slug: "kids" },
            };
            const result = await service.register(dto);
            expect(prismaMock.org.create).toHaveBeenCalledTimes(1);
            expect(mockBilling.checkout).not.toHaveBeenCalled();
            expect(result).toEqual(expect.objectContaining({
                org: expect.objectContaining({ id: baseOrg.id }),
            }));
            // also ensure billing was not returned when omitted
            expect(result.billing).toBeUndefined();
        });
    });
});
