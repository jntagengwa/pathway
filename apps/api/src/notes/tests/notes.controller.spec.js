import { NotesController } from "../notes.controller";
// Typed mock for NotesService
const mockService = () => ({
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
});
describe("NotesController", () => {
    let controller;
    let service;
    const childId = "11111111-1111-1111-1111-111111111111";
    const authorId = "22222222-2222-2222-2222-222222222222";
    const id = "33333333-3333-3333-3333-333333333333";
    const tenantId = "44444444-4444-4444-4444-444444444444";
    const orgId = "55555555-5555-5555-5555-555555555555";
    beforeEach(() => {
        service = mockService();
        controller = new NotesController(service);
    });
    describe("create", () => {
        it("parses body and calls service.create", async () => {
            const body = { childId, text: "  Hello  " };
            const created = {
                id,
                childId,
                authorId,
                text: "Hello",
                visibleToParents: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            service.create.mockResolvedValue(created);
            const res = await controller.create(body, tenantId, orgId, authorId);
            expect(service.create).toHaveBeenCalledTimes(1);
            const arg = service.create.mock.calls[0][0];
            expect(arg).toEqual({ childId, text: "Hello" });
            expect(res).toEqual(created);
            expect(service.create).toHaveBeenCalledWith(arg, authorId, expect.objectContaining({ tenantId, orgId, actorUserId: authorId }));
        });
    });
    describe("findAll", () => {
        it("parses query and forwards filters", async () => {
            const query = { childId, authorId };
            const items = [
                {
                    id,
                    childId,
                    authorId,
                    text: "t",
                    visibleToParents: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];
            service.findAll.mockResolvedValue(items);
            const res = await controller.findAll(query, tenantId, orgId, authorId);
            expect(service.findAll).toHaveBeenCalledTimes(1);
            const filters = service.findAll.mock.calls[0][0];
            expect(filters).toEqual({ childId, authorId });
            expect(service.findAll).toHaveBeenCalledWith({ childId, authorId }, expect.objectContaining({ tenantId, orgId, actorUserId: authorId }));
            expect(res).toEqual(items);
        });
    });
    describe("findOne", () => {
        it("validates id and returns note", async () => {
            const item = {
                id,
                childId,
                authorId,
                text: "t",
                visibleToParents: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            service.findOne.mockResolvedValue(item);
            const res = await controller.findOne({ id }, tenantId, orgId, authorId);
            expect(service.findOne).toHaveBeenCalledWith(id, expect.objectContaining({ tenantId, orgId, actorUserId: authorId }));
            expect(res).toEqual(item);
        });
    });
    describe("update", () => {
        it("parses body and calls service.update", async () => {
            const patch = { text: "Updated" };
            const updated = {
                id,
                childId,
                authorId,
                text: "Updated",
                visibleToParents: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            service.update.mockResolvedValue(updated);
            const res = await controller.update({ id }, patch, tenantId, orgId, authorId);
            expect(service.update).toHaveBeenCalledTimes(1);
            const arg = service.update.mock.calls[0][1];
            expect(arg.text).toBe("Updated");
            expect(res).toEqual(updated);
            expect(service.update).toHaveBeenCalledWith(id, arg, expect.objectContaining({ tenantId, orgId, actorUserId: authorId }));
        });
    });
    describe("remove", () => {
        it("validates id and calls service.remove", async () => {
            const deleted = { id };
            service.remove.mockResolvedValue(deleted);
            const res = await controller.remove({ id }, tenantId, orgId, authorId);
            expect(service.remove).toHaveBeenCalledWith(id, expect.objectContaining({ tenantId, orgId, actorUserId: authorId }));
            expect(res).toEqual(deleted);
        });
    });
});
