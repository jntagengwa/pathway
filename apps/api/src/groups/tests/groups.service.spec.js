import { BadRequestException, NotFoundException } from "@nestjs/common";
import { GroupsService } from "../../groups/groups.service";
// Mock Prisma before importing service usage
jest.mock("@pathway/db", () => ({
    prisma: {
        group: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        tenant: {
            findUnique: jest.fn(),
        },
    },
}));
import { prisma } from "@pathway/db";
const findMany = prisma.group.findMany;
const findFirst = prisma.group.findFirst;
const create = prisma.group.create;
const update = prisma.group.update;
const tFindUnique = prisma.tenant.findUnique;
describe("GroupsService", () => {
    let svc;
    const group = {
        id: "g1",
        name: "Kids 7-9",
        tenantId: "t1",
        minAge: 7,
        maxAge: 9,
    };
    const tenantId = "t1";
    beforeEach(() => {
        jest.clearAllMocks();
        svc = new GroupsService();
        tFindUnique.mockResolvedValue({ id: "t1" });
    });
    describe("list", () => {
        it("returns groups", async () => {
            findMany.mockResolvedValue([group]);
            await expect(svc.list(tenantId)).resolves.toEqual([group]);
            expect(findMany).toHaveBeenCalledWith({
                where: { tenantId },
                select: { id: true, name: true, tenantId: true },
                orderBy: { name: "asc" },
            });
        });
    });
    describe("getById", () => {
        it("returns a group when found", async () => {
            findFirst.mockResolvedValue(group);
            await expect(svc.getById("g1", tenantId)).resolves.toEqual(group);
            expect(findFirst).toHaveBeenCalledWith({
                where: { id: "g1", tenantId },
                select: {
                    id: true,
                    name: true,
                    tenantId: true,
                    minAge: true,
                    maxAge: true,
                },
            });
        });
        it("throws NotFound when missing", async () => {
            findFirst.mockResolvedValue(null);
            await expect(svc.getById("missing", tenantId)).rejects.toBeInstanceOf(NotFoundException);
        });
    });
    describe("create", () => {
        it("validates & creates with tenant connect", async () => {
            tFindUnique.mockResolvedValue({ id: "t1" });
            findFirst.mockResolvedValue(null); // no duplicate
            create.mockResolvedValue(group);
            const result = await svc.create({
                name: "Kids 7-9",
                tenantId,
                minAge: 7,
                maxAge: 9,
            }, tenantId);
            expect(findFirst).toHaveBeenCalledWith({
                where: { tenantId, name: "Kids 7-9" },
            });
            expect(create).toHaveBeenCalledWith({
                data: {
                    name: "Kids 7-9",
                    minAge: 7,
                    maxAge: 9,
                    tenant: { connect: { id: tenantId } },
                },
                select: {
                    id: true,
                    name: true,
                    tenantId: true,
                    minAge: true,
                    maxAge: true,
                },
            });
            expect(result).toEqual(group);
        });
        it("throws BadRequest when duplicate (pre-check)", async () => {
            tFindUnique.mockResolvedValue({ id: "t1" });
            findFirst.mockResolvedValue(group);
            await expect(svc.create({ name: "Kids 7-9", tenantId, minAge: 7, maxAge: 9 }, tenantId)).rejects.toBeInstanceOf(BadRequestException);
            expect(create).not.toHaveBeenCalled();
        });
        it("throws BadRequest when unique constraint race (P2002)", async () => {
            tFindUnique.mockResolvedValue({ id: "t1" });
            findFirst.mockResolvedValue(null);
            const p2002 = Object.assign(new Error("Unique"), { code: "P2002" });
            create.mockRejectedValue(p2002);
            await expect(svc.create({ name: "Kids 7-9", tenantId, minAge: 7, maxAge: 9 }, tenantId)).rejects.toBeInstanceOf(BadRequestException);
        });
        it("throws BadRequest for invalid ages (min>max)", async () => {
            await expect(svc.create({ name: "Bad", tenantId, minAge: 10, maxAge: 9 }, tenantId)).rejects.toBeInstanceOf(BadRequestException);
            expect(create).not.toHaveBeenCalled();
        });
    });
    describe("update", () => {
        it("updates name and ages", async () => {
            findFirst.mockResolvedValue({ id: "g1", tenantId });
            update.mockResolvedValue({
                ...group,
                name: "Kids 6-10",
                minAge: 6,
                maxAge: 10,
            });
            const payload = {
                name: "Kids 6-10",
                minAge: 6,
                maxAge: 10,
            };
            const result = await svc.update("g1", payload, tenantId);
            expect(findFirst).toHaveBeenCalledWith({
                where: { id: "g1", tenantId },
                select: { id: true, tenantId: true },
            });
            expect(update).toHaveBeenCalledWith({
                where: { id: "g1" },
                data: payload,
                select: {
                    id: true,
                    name: true,
                    tenantId: true,
                    minAge: true,
                    maxAge: true,
                },
            });
            expect(result).toMatchObject({
                name: "Kids 6-10",
                minAge: 6,
                maxAge: 10,
            });
        });
        it("throws BadRequest when unique name conflict (P2002)", async () => {
            findFirst.mockResolvedValue({ id: "g1", tenantId });
            const p2002 = Object.assign(new Error("Unique"), { code: "P2002" });
            update.mockRejectedValue(p2002);
            await expect(svc.update("g1", { name: "Dup" }, tenantId)).rejects.toBeInstanceOf(BadRequestException);
        });
        it("throws NotFound when group missing (P2025)", async () => {
            findFirst.mockResolvedValue({ id: "missing", tenantId });
            const p2025 = Object.assign(new Error("Missing"), { code: "P2025" });
            update.mockRejectedValue(p2025);
            await expect(svc.update("missing", { name: "X" }, tenantId)).rejects.toBeInstanceOf(NotFoundException);
        });
        it("throws BadRequest when invalid ages provided", async () => {
            findFirst.mockResolvedValue({ id: "g1", tenantId });
            const badPayload = { minAge: 10, maxAge: 9 };
            await expect(svc.update("g1", badPayload, tenantId)).rejects.toBeInstanceOf(BadRequestException);
            expect(update).not.toHaveBeenCalled();
        });
    });
});
