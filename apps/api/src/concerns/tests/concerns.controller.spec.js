import { ConcernsController } from "../concerns.controller";
// Typed mock for ConcernsService
const mockService = () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
});
describe("ConcernsController", () => {
    let controller;
    let service;
    const childId = "11111111-1111-1111-1111-111111111111";
    const id = "22222222-2222-2222-2222-222222222222";
    const tenantId = "33333333-3333-3333-3333-333333333333";
    const orgId = "44444444-4444-4444-4444-444444444444";
    const userId = "55555555-5555-5555-5555-555555555555";
    beforeEach(() => {
        service = mockService();
        controller = new ConcernsController(service);
    });
    describe("create", () => {
        it("parses body and calls service.create", async () => {
            const body = {
                childId,
                summary: "  Behavioural issue  ",
                details: "  Talked during lesson  ",
            };
            const created = {
                id,
                childId,
                summary: "Behavioural issue",
                details: "Talked during lesson",
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            service.create.mockResolvedValue(created);
            const res = await controller.create(body, tenantId, orgId, userId);
            expect(service.create).toHaveBeenCalledTimes(1);
            const arg = service.create.mock.calls[0][0];
            expect(arg.childId).toBe(childId);
            expect(typeof arg.summary).toBe("string");
            expect(res).toEqual(created);
            expect(service.create).toHaveBeenCalledWith(expect.any(Object), expect.objectContaining({ tenantId, orgId, actorUserId: userId }));
        });
    });
    describe("findAll", () => {
        it("parses query and forwards filters", async () => {
            const query = { childId };
            const items = [
                {
                    id,
                    childId,
                    summary: "s",
                    details: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];
            service.findAll.mockResolvedValue(items);
            const res = await controller.findAll(query, tenantId, orgId, userId);
            expect(service.findAll).toHaveBeenCalledTimes(1);
            const filters = service.findAll.mock.calls[0][0];
            expect(filters).toEqual({ childId });
            expect(service.findAll).toHaveBeenCalledWith({ childId }, expect.objectContaining({ tenantId, orgId, actorUserId: userId }));
            expect(res).toEqual(items);
        });
    });
    describe("findOne", () => {
        it("validates id and returns concern", async () => {
            const item = {
                id,
                childId,
                summary: "s",
                details: null,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            service.findOne.mockResolvedValue(item);
            const res = await controller.findOne({ id }, tenantId, orgId, userId);
            expect(service.findOne).toHaveBeenCalledWith(id, expect.objectContaining({ tenantId, orgId, actorUserId: userId }));
            expect(res).toEqual(item);
        });
    });
    describe("update", () => {
        it("parses body and calls service.update", async () => {
            const patch = { summary: "Updated", details: "Adjusted" };
            const updated = {
                id,
                childId,
                summary: "Updated",
                details: "Adjusted",
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            service.update.mockResolvedValue(updated);
            const res = await controller.update({ id }, patch, tenantId, orgId, userId);
            expect(service.update).toHaveBeenCalledTimes(1);
            const arg = service.update.mock.calls[0][1];
            expect(arg.summary).toBe("Updated");
            expect(arg.details).toBe("Adjusted");
            expect(res).toEqual(updated);
            expect(service.update).toHaveBeenCalledWith(id, arg, expect.objectContaining({ tenantId, orgId, actorUserId: userId }));
        });
    });
    describe("remove", () => {
        it("validates id and calls service.remove", async () => {
            const deleted = { id };
            service.remove.mockResolvedValue(deleted);
            const res = await controller.remove({ id }, tenantId, orgId, userId);
            expect(service.remove).toHaveBeenCalledWith(id, expect.objectContaining({ tenantId, orgId, actorUserId: userId }));
            expect(res).toEqual(deleted);
        });
    });
});
