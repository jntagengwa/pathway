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
  },
}));

// Now import the mocked prisma to get references to the mock functions
import { prisma } from "@pathway/db";
const findMany = prisma.tenant.findMany as unknown as jest.Mock;
const findUnique = prisma.tenant.findUnique as unknown as jest.Mock;
const create = prisma.tenant.create as unknown as jest.Mock;

describe("TenantsService", () => {
  let svc: TenantsService;

  const tenant = {
    id: "t1",
    name: "Demo Church",
    slug: "demo-church",
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new TenantsService();
  });

  describe("list", () => {
    it("returns tenants", async () => {
      findMany.mockResolvedValue([tenant]);
      await expect(svc.list()).resolves.toEqual([tenant]);
      expect(findMany).toHaveBeenCalledWith({
        select: { id: true, name: true, slug: true, createdAt: true },
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
        select: { id: true, name: true, slug: true, createdAt: true },
      });
    });

    it("throws NotFound when missing", async () => {
      findUnique.mockResolvedValue(null);
      await expect(svc.getBySlug("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    it("lowercases slug and creates tenant", async () => {
      findUnique.mockResolvedValue(null); // pre-check: no duplicate
      create.mockResolvedValue({ ...tenant, slug: "new-church" });

      const result = await svc.create({
        name: "New Church",
        slug: "New-Church",
      });
      expect(findUnique).toHaveBeenCalledWith({
        where: { slug: "new-church" },
      });
      expect(create).toHaveBeenCalledWith({
        data: { name: "New Church", slug: "new-church" },
        select: { id: true, name: true, slug: true, createdAt: true },
      });
      expect(result.slug).toBe("new-church");
    });

    it("throws BadRequest when slug already exists (pre-check)", async () => {
      findUnique.mockResolvedValue(tenant); // duplicate
      await expect(
        svc.create({ name: "Dup", slug: "demo-church" }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(create).not.toHaveBeenCalled();
    });

    it("throws BadRequest when unique constraint race occurs (P2002)", async () => {
      findUnique.mockResolvedValue(null);
      const p2002 = Object.assign(new Error("Unique constraint"), {
        code: "P2002",
      });
      create.mockRejectedValue(p2002);

      await expect(
        svc.create({ name: "Race", slug: "race-church" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
