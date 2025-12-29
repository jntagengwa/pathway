import { BadRequestException, NotFoundException } from "@nestjs/common";
import { TenantsService } from "../tenants.service";
// Mock the shared Prisma client module-first, then access its fns via import
jest.mock("@pathway/db", () => ({
    prisma: {
        tenant: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        org: {
            findUnique: jest.fn(),
        },
    },
}));
// Now import the mocked prisma to get references to the mock functions
import { prisma } from "@pathway/db";
const findMany = prisma.tenant.findMany;
const findUnique = prisma.tenant.findUnique;
const create = prisma.tenant.create;
const orgFindUnique = prisma.org.findUnique;
describe("TenantsService", () => {
    let svc;
    const tenant = {
        id: "t1",
        name: "Demo Church",
        slug: "demo-church",
        createdAt: new Date(),
    };
    const ORG_ID = "11111111-1111-1111-1111-111111111111";
    beforeEach(() => {
        jest.clearAllMocks();
        svc = new TenantsService();
        orgFindUnique.mockResolvedValue({ id: ORG_ID });
    });
    describe("list", () => {
        it("returns tenants", async () => {
            findMany.mockResolvedValue([tenant]);
            await expect(svc.list()).resolves.toEqual([tenant]);
            expect(findMany).toHaveBeenCalledWith({
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: { createdAt: "desc" },
            });
        });
    });
    describe("getBySlug", () => {
        it("returns a tenant when found", async () => {
            findUnique.mockResolvedValue(tenant);
            await expect(svc.getBySlug("demo-church")).resolves.toEqual(tenant);
            expect(findUnique).toHaveBeenCalledWith({
                where: { slug: "demo-church" },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
        });
        it("throws NotFound when missing", async () => {
            findUnique.mockResolvedValue(null);
            await expect(svc.getBySlug("missing")).rejects.toBeInstanceOf(NotFoundException);
        });
    });
    describe("create", () => {
        it("lowercases slug and creates tenant", async () => {
            findUnique.mockResolvedValue(null); // pre-check: no duplicate
            create.mockResolvedValue({ ...tenant, slug: "new-church" });
            const result = await svc.create({
                name: "New Church",
                slug: "New-Church",
                orgId: ORG_ID,
            });
            expect(findUnique).toHaveBeenCalledWith({
                where: { slug: "new-church" },
            });
            expect(create).toHaveBeenCalledWith({
                data: {
                    name: "New Church",
                    slug: "new-church",
                    org: { connect: { id: ORG_ID } },
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            expect(orgFindUnique).toHaveBeenCalledWith({
                where: { id: ORG_ID },
                select: { id: true },
            });
            expect(result.slug).toBe("new-church");
        });
        it("creates tenant and connects optional relations when provided", async () => {
            findUnique.mockResolvedValue(null); // pre-check: no duplicate
            create.mockResolvedValue({ ...tenant, slug: "demo-with-links" });
            const dto = {
                orgId: ORG_ID,
                name: "Demo With Links",
                slug: "demo-with-links",
                users: [
                    "11111111-1111-1111-1111-111111111111",
                    "22222222-2222-2222-2222-222222222222",
                ],
                groups: ["33333333-3333-3333-3333-333333333333"],
                children: [
                    "44444444-4444-4444-4444-444444444444",
                    "55555555-5555-5555-5555-555555555555",
                    "66666666-6666-6666-6666-666666666666",
                ],
                roles: ["77777777-7777-7777-7777-777777777777"],
            };
            const result = await svc.create(dto);
            expect(create).toHaveBeenCalledWith({
                data: {
                    org: { connect: { id: ORG_ID } },
                    name: "Demo With Links",
                    slug: "demo-with-links",
                    users: {
                        connect: [
                            { id: "11111111-1111-1111-1111-111111111111" },
                            { id: "22222222-2222-2222-2222-222222222222" },
                        ],
                    },
                    groups: {
                        connect: [{ id: "33333333-3333-3333-3333-333333333333" }],
                    },
                    children: {
                        connect: [
                            { id: "44444444-4444-4444-4444-444444444444" },
                            { id: "55555555-5555-5555-5555-555555555555" },
                            { id: "66666666-6666-6666-6666-666666666666" },
                        ],
                    },
                    roles: {
                        connect: [{ id: "77777777-7777-7777-7777-777777777777" }],
                    },
                },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            expect(orgFindUnique).toHaveBeenCalledWith({
                where: { id: ORG_ID },
                select: { id: true },
            });
            expect(result.slug).toBe("demo-with-links");
        });
        it("throws BadRequest when slug already exists (pre-check)", async () => {
            findUnique.mockResolvedValue(tenant); // duplicate
            await expect(svc.create({ name: "Dup", slug: "demo-church", orgId: ORG_ID })).rejects.toBeInstanceOf(BadRequestException);
            expect(create).not.toHaveBeenCalled();
        });
        it("throws BadRequest when unique constraint race occurs (P2002)", async () => {
            findUnique.mockResolvedValue(null);
            const p2002 = Object.assign(new Error("Unique constraint"), {
                code: "P2002",
            });
            create.mockRejectedValue(p2002);
            await expect(svc.create({ name: "Race", slug: "race-church", orgId: ORG_ID })).rejects.toBeInstanceOf(BadRequestException);
        });
    });
});
