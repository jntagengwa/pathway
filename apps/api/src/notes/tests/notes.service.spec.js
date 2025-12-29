import { BadRequestException, NotFoundException } from "@nestjs/common";
import { NotesService } from "../notes.service";
// Prisma mocks
const childFindFirst = jest.fn();
const userFindFirst = jest.fn();
const noteCreate = jest.fn();
const noteUpdate = jest.fn();
const noteDelete = jest.fn();
const noteFindFirst = jest.fn();
const noteFindMany = jest.fn();
jest.mock("@pathway/db", () => ({
    prisma: {
        child: { findFirst: (arg) => childFindFirst(arg) },
        user: { findFirst: (arg) => userFindFirst(arg) },
        childNote: {
            create: (arg) => noteCreate(arg),
            update: (arg) => noteUpdate(arg),
            delete: (arg) => noteDelete(arg),
            findFirst: (arg) => noteFindFirst(arg),
            findMany: (arg) => noteFindMany(arg),
        },
    },
}));
describe("NotesService", () => {
    let service;
    const childId = "11111111-1111-1111-1111-111111111111";
    const authorId = "22222222-2222-2222-2222-222222222222";
    const noteId = "33333333-3333-3333-3333-333333333333";
    const tenantId = "44444444-4444-4444-4444-444444444444";
    const orgId = "55555555-5555-5555-5555-555555555555";
    const actorUserId = "66666666-6666-6666-6666-666666666666";
    const context = { tenantId, orgId, actorUserId };
    const auditStub = {
        recordEvent: jest.fn().mockResolvedValue(undefined),
    };
    beforeEach(() => {
        jest.clearAllMocks();
        service = new NotesService(auditStub);
    });
    describe("create", () => {
        it("creates a note when child and author exist", async () => {
            childFindFirst.mockResolvedValue({ id: childId });
            userFindFirst.mockResolvedValue({ id: authorId });
            const created = {
                id: noteId,
                childId,
                authorId,
                text: "Hello",
                visibleToParents: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            noteCreate.mockResolvedValue(created);
            const res = await service.create({ childId, text: "Hello" }, authorId, context);
            expect(childFindFirst).toHaveBeenCalledWith({
                where: { id: childId, tenantId },
                select: { id: true },
            });
            expect(userFindFirst).toHaveBeenCalledWith({
                where: { id: authorId, tenantId },
                select: { id: true },
            });
            expect(noteCreate).toHaveBeenCalled();
            expect(res).toEqual(created);
            expect(auditStub.recordEvent).toHaveBeenCalledWith(expect.objectContaining({
                action: expect.any(String),
                entityType: expect.any(String),
                entityId: noteId,
            }));
        });
        it("throws NotFound when child missing", async () => {
            childFindFirst.mockResolvedValue(null);
            userFindFirst.mockResolvedValue({ id: authorId });
            await expect(service.create({ childId, text: "x" }, authorId, context)).rejects.toBeInstanceOf(NotFoundException);
            expect(noteCreate).not.toHaveBeenCalled();
        });
        it("throws NotFound when author missing", async () => {
            childFindFirst.mockResolvedValue({ id: childId });
            userFindFirst.mockResolvedValue(null);
            await expect(service.create({ childId, text: "x" }, authorId, context)).rejects.toBeInstanceOf(NotFoundException);
            expect(noteCreate).not.toHaveBeenCalled();
        });
        it("maps Prisma FK error to BadRequest", async () => {
            childFindFirst.mockResolvedValue({ id: childId });
            userFindFirst.mockResolvedValue({ id: authorId });
            noteCreate.mockRejectedValue({ code: "P2003", message: "fk" });
            await expect(service.create({ childId, text: "x" }, authorId, context)).rejects.toBeInstanceOf(BadRequestException);
        });
    });
    describe("findAll", () => {
        it("passes filters and returns list", async () => {
            const items = [
                {
                    id: noteId,
                    childId,
                    authorId,
                    text: "t",
                    visibleToParents: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];
            noteFindMany.mockResolvedValue(items);
            const res = await service.findAll({ childId, authorId }, context);
            expect(noteFindMany).toHaveBeenCalled();
            expect(Array.isArray(res)).toBe(true);
            expect(res[0].childId).toBe(childId);
            expect(noteFindMany).toHaveBeenCalledWith({
                where: {
                    child: { tenantId },
                    childId,
                    authorId,
                },
                orderBy: { createdAt: "desc" },
            });
        });
    });
    describe("findOne", () => {
        it("returns note when found", async () => {
            const item = {
                id: noteId,
                childId,
                authorId,
                text: "t",
                visibleToParents: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            noteFindFirst.mockResolvedValue(item);
            const res = await service.findOne(noteId, context);
            expect(res).toEqual(item);
        });
        it("throws NotFound when missing", async () => {
            noteFindFirst.mockResolvedValue(null);
            await expect(service.findOne(noteId, context)).rejects.toBeInstanceOf(NotFoundException);
        });
    });
    describe("update", () => {
        it("updates text and returns note", async () => {
            const updated = {
                id: noteId,
                childId,
                authorId,
                text: "updated",
                visibleToParents: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            noteFindFirst.mockResolvedValue(updated);
            noteUpdate.mockResolvedValue(updated);
            const res = await service.update(noteId, { text: "updated" }, context);
            expect(noteUpdate).toHaveBeenCalled();
            expect(res).toEqual(updated);
            expect(auditStub.recordEvent).toHaveBeenCalledWith(expect.objectContaining({
                action: expect.any(String),
                entityId: noteId,
            }));
        });
        it("maps P2025 to NotFound on update", async () => {
            noteFindFirst.mockResolvedValue({
                id: noteId,
                childId,
                authorId,
                text: "t",
                visibleToParents: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            noteUpdate.mockRejectedValue({ code: "P2025", message: "not found" });
            await expect(service.update(noteId, { text: "x" }, context)).rejects.toBeInstanceOf(NotFoundException);
        });
    });
    describe("remove", () => {
        it("deletes by id and returns payload", async () => {
            const deleted = { id: noteId };
            noteFindFirst.mockResolvedValue({
                id: noteId,
                childId,
                authorId,
                text: "t",
                visibleToParents: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            noteDelete.mockResolvedValue(deleted);
            const res = await service.remove(noteId, context);
            expect(res).toEqual(deleted);
            expect(auditStub.recordEvent).toHaveBeenCalledWith(expect.objectContaining({
                action: expect.any(String),
                entityId: noteId,
            }));
        });
        it("maps P2025 to NotFound on delete", async () => {
            noteFindFirst.mockResolvedValue({
                id: noteId,
                childId,
                authorId,
                text: "t",
                visibleToParents: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            noteDelete.mockRejectedValue({ code: "P2025", message: "not found" });
            await expect(service.remove(noteId, context)).rejects.toBeInstanceOf(NotFoundException);
        });
        it("maps P2003 to BadRequest on delete", async () => {
            noteFindFirst.mockResolvedValue({
                id: noteId,
                childId,
                authorId,
                text: "t",
                visibleToParents: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            noteDelete.mockRejectedValue({ code: "P2003", message: "fk" });
            await expect(service.remove(noteId, context)).rejects.toBeInstanceOf(BadRequestException);
        });
    });
});
