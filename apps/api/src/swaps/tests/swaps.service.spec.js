/* eslint-disable @typescript-eslint/no-explicit-any */
// Local shim to avoid importing @pathway/db (which pulls in @prisma/client at runtime)
var SwapStatus;
(function (SwapStatus) {
    SwapStatus["REQUESTED"] = "REQUESTED";
    SwapStatus["ACCEPTED"] = "ACCEPTED";
    SwapStatus["REJECTED"] = "REJECTED";
    SwapStatus["CANCELLED"] = "CANCELLED";
})(SwapStatus || (SwapStatus = {}));
describe("SwapsService", () => {
    const base = {
        id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        assignmentId: "11111111-1111-1111-1111-111111111111",
        fromUserId: "22222222-2222-2222-2222-222222222222",
        toUserId: null,
        status: SwapStatus.REQUESTED,
        createdAt: new Date("2025-01-01T12:00:00Z"),
        updatedAt: new Date("2025-01-01T12:00:00Z"),
    };
    const tenantId = "t1";
    let prisma;
    let SwapsServiceClass;
    let service;
    beforeEach(async () => {
        jest.resetModules();
        const prismaMock = {
            swapRequest: {
                create: jest.fn(async ({ data }) => ({ ...base, ...data })),
                findFirst: jest.fn(async ({ where }) => ({ ...base, ...where })),
                findMany: jest.fn(async () => [base]),
                update: jest.fn(async ({ where, data }) => ({
                    ...base,
                    ...where,
                    ...data,
                })),
                deleteMany: jest.fn(async () => ({ count: 1 })),
            },
            assignment: {
                findFirst: jest.fn(async () => ({ id: base.assignmentId })),
            },
            user: {
                findFirst: jest.fn(async () => ({ id: base.fromUserId })),
            },
        };
        jest.doMock("@pathway/db", () => ({ prisma: prismaMock, SwapStatus }));
        prisma = prismaMock;
        SwapsServiceClass = (await import("../../swaps/swaps.service"))
            .SwapsService;
        service = new SwapsServiceClass();
    });
    it("creates a swap", async () => {
        const created = await service.create({
            assignmentId: base.assignmentId,
            fromUserId: base.fromUserId,
            toUserId: base.toUserId,
        }, tenantId);
        expect(prisma.swapRequest.create).toHaveBeenCalled();
        expect(created.assignmentId).toBe(base.assignmentId);
    });
    it("validates ACCEPTED requires toUserId", async () => {
        await expect(service.create({
            assignmentId: base.assignmentId,
            fromUserId: base.fromUserId,
            status: SwapStatus.ACCEPTED,
        }, tenantId)).rejects.toBeInstanceOf(Error);
    });
    it("findAll filters by tenant", async () => {
        await service.findAll({
            tenantId,
            fromUserId: base.fromUserId,
            status: SwapStatus.REQUESTED,
        });
        expect(prisma.swapRequest.findMany).toHaveBeenCalled();
    });
    it("findOne returns swap", async () => {
        const found = await service.findOne(base.id, tenantId);
        expect(found).toHaveProperty("id", base.id);
    });
    it("update passes through", async () => {
        const res = await service.update(base.id, { status: SwapStatus.ACCEPTED, toUserId: base.fromUserId }, tenantId);
        expect(prisma.swapRequest.update).toHaveBeenCalled();
        expect(res.status).toBe(SwapStatus.ACCEPTED);
    });
    it("remove deletes with tenant scoping", async () => {
        await service.remove(base.id, tenantId);
        expect(prisma.swapRequest.deleteMany).toHaveBeenCalled();
    });
});
export {};
