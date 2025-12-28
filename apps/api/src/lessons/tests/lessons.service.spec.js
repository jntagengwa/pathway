import { BadRequestException, NotFoundException } from "@nestjs/common";
import { LessonsService } from "../lessons.service";
// Mock prisma from @pathway/db
const tenantFindUnique = jest.fn();
const groupFindUnique = jest.fn();
const lessonCreate = jest.fn();
const lessonUpdate = jest.fn();
const lessonDelete = jest.fn();
const lessonFindFirst = jest.fn();
const lessonFindMany = jest.fn();
jest.mock("@pathway/db", () => ({
    prisma: {
        tenant: { findUnique: (...args) => tenantFindUnique(...args) },
        group: { findUnique: (...args) => groupFindUnique(...args) },
        lesson: {
            create: (...args) => lessonCreate(...args),
            update: (...args) => lessonUpdate(...args),
            delete: (...args) => lessonDelete(...args),
            findFirst: (...args) => lessonFindFirst(...args),
            findMany: (...args) => lessonFindMany(...args),
        },
    },
}));
describe("LessonsService", () => {
    let service;
    const tenantId = "11111111-1111-1111-1111-111111111111";
    const groupId = "22222222-2222-2222-2222-222222222222";
    const lessonId = "33333333-3333-3333-3333-333333333333";
    const baseDate = new Date("2025-01-06T00:00:00.000Z");
    beforeEach(() => {
        jest.clearAllMocks();
        service = new LessonsService();
    });
    describe("create", () => {
        it("creates a lesson (no group)", async () => {
            tenantFindUnique.mockResolvedValue({ id: tenantId });
            lessonCreate.mockResolvedValue({
                id: lessonId,
                tenantId,
                groupId: null,
                title: "A",
                description: null,
                fileKey: null,
                weekOf: baseDate,
            });
            const res = await service.create({
                tenantId,
                title: "A",
                weekOf: baseDate,
            }, tenantId);
            expect(tenantFindUnique).toHaveBeenCalledWith({
                where: { id: tenantId },
                select: { id: true },
            });
            expect(lessonCreate).toHaveBeenCalledWith({
                data: {
                    tenantId,
                    groupId: null,
                    title: "A",
                    description: null,
                    fileKey: null,
                    weekOf: baseDate,
                },
            });
            expect(res.id).toBe(lessonId);
        });
        it("validates group belongs to tenant", async () => {
            tenantFindUnique.mockResolvedValue({ id: tenantId });
            groupFindUnique.mockResolvedValue({ id: groupId, tenantId });
            lessonCreate.mockResolvedValue({ id: lessonId });
            await service.create({
                tenantId,
                groupId,
                title: "A",
                weekOf: baseDate,
            }, tenantId);
            expect(groupFindUnique).toHaveBeenCalledWith({
                where: { id: groupId },
                select: { id: true, tenantId: true },
            });
            expect(lessonCreate).toHaveBeenCalledWith(expect.objectContaining({
                data: expect.objectContaining({ groupId }),
            }));
            expect(lessonCreate).toHaveBeenCalled();
        });
        it("throws NotFound when tenant missing", async () => {
            tenantFindUnique.mockResolvedValue(null);
            await expect(service.create({ tenantId, title: "A", weekOf: baseDate }, tenantId)).rejects.toBeInstanceOf(NotFoundException);
            expect(lessonCreate).not.toHaveBeenCalled();
        });
        it("throws BadRequest when group belongs to different tenant", async () => {
            tenantFindUnique.mockResolvedValue({ id: tenantId });
            groupFindUnique.mockResolvedValue({
                id: groupId,
                tenantId: "aaaa-bbbb",
            });
            await expect(service.create({ tenantId, groupId, title: "A", weekOf: baseDate }, tenantId)).rejects.toBeInstanceOf(BadRequestException);
            expect(lessonCreate).not.toHaveBeenCalled();
        });
        it("maps Prisma FK error to BadRequest", async () => {
            tenantFindUnique.mockResolvedValue({ id: tenantId });
            lessonCreate.mockRejectedValue({ code: "P2003", message: "FK failed" });
            await expect(service.create({ tenantId, title: "A", weekOf: baseDate }, tenantId)).rejects.toBeInstanceOf(BadRequestException);
        });
    });
    describe("update", () => {
        it("updates a lesson", async () => {
            lessonFindFirst.mockResolvedValue({ id: lessonId, tenantId, groupId });
            groupFindUnique.mockResolvedValue({ id: groupId, tenantId });
            const newDate = new Date("2025-01-13T00:00:00.000Z");
            lessonUpdate.mockResolvedValue({ id: lessonId, weekOf: newDate });
            const res = await service.update(lessonId, {
                title: "B",
                weekOf: newDate,
                groupId,
            }, tenantId);
            expect(lessonFindFirst).toHaveBeenCalledWith({
                where: { id: lessonId, tenantId },
            });
            expect(lessonUpdate).toHaveBeenCalledWith({
                where: { id: lessonId },
                data: expect.objectContaining({ title: "B", weekOf: newDate }),
            });
            expect(res.weekOf).toEqual(newDate);
        });
        it("rejects if lesson not found", async () => {
            lessonFindFirst.mockResolvedValue(null);
            await expect(service.update(lessonId, { title: "B" }, tenantId)).rejects.toBeInstanceOf(NotFoundException);
            expect(lessonFindFirst).toHaveBeenCalledWith({
                where: { id: lessonId, tenantId },
            });
        });
        it("rejects if new group belongs to another tenant", async () => {
            lessonFindFirst.mockResolvedValue({ id: lessonId, tenantId });
            groupFindUnique.mockResolvedValue({
                id: groupId,
                tenantId: "other-tenant",
            });
            await expect(service.update(lessonId, { groupId }, tenantId)).rejects.toBeInstanceOf(BadRequestException);
            expect(lessonUpdate).not.toHaveBeenCalled();
        });
        it("maps Prisma not found to NotFound", async () => {
            lessonFindFirst.mockResolvedValue({ id: lessonId, tenantId });
            lessonUpdate.mockRejectedValue({
                code: "P2025",
                message: "Record not found",
            });
            await expect(service.update(lessonId, { title: "B" }, tenantId)).rejects.toBeInstanceOf(NotFoundException);
        });
    });
    describe("remove", () => {
        it("deletes a lesson", async () => {
            lessonFindFirst.mockResolvedValue({ id: lessonId, tenantId });
            lessonDelete.mockResolvedValue({ id: lessonId });
            const res = await service.remove(lessonId, tenantId);
            expect(res).toEqual({ id: lessonId });
            expect(lessonFindFirst).toHaveBeenCalledWith({
                where: { id: lessonId, tenantId },
            });
            expect(lessonDelete).toHaveBeenCalledWith({ where: { id: lessonId } });
        });
        it("maps Prisma P2025 to NotFound", async () => {
            lessonFindFirst.mockResolvedValue({ id: lessonId, tenantId });
            lessonDelete.mockRejectedValue({ code: "P2025", message: "not found" });
            await expect(service.remove(lessonId, tenantId)).rejects.toBeInstanceOf(NotFoundException);
        });
        it("maps Prisma P2003 to BadRequest", async () => {
            lessonFindFirst.mockResolvedValue({ id: lessonId, tenantId });
            lessonDelete.mockRejectedValue({ code: "P2003", message: "fk" });
            await expect(service.remove(lessonId, tenantId)).rejects.toBeInstanceOf(BadRequestException);
        });
    });
});
