import { BadRequestException, NotFoundException } from "@nestjs/common";
import { UsersService } from "../../users/users.service";

// Mock Prisma first, then import and alias mocks
jest.mock("@pathway/db", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    child: {
      findMany: jest.fn(),
    },
  },
}));

import { prisma } from "@pathway/db";
const uFindMany = prisma.user.findMany as unknown as jest.Mock;
const uFindUnique = prisma.user.findUnique as unknown as jest.Mock;
const uFindFirst = prisma.user.findFirst as unknown as jest.Mock;
const uCreate = prisma.user.create as unknown as jest.Mock;
const uUpdate = prisma.user.update as unknown as jest.Mock;
const cFindMany = prisma.child.findMany as unknown as jest.Mock;

describe("UsersService", () => {
  let svc: UsersService;

  const now = new Date();
  const baseUser = {
    id: "u1",
    email: "alice@example.com",
    name: "Alice",
    tenantId: "t1",
    hasServeAccess: false,
    hasFamilyAccess: false,
    createdAt: now,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new UsersService();
  });

  describe("list", () => {
    it("returns users", async () => {
      uFindMany.mockResolvedValue([baseUser]);
      await expect(svc.list()).resolves.toEqual([baseUser]);
      expect(uFindMany).toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("returns a user when found", async () => {
      uFindUnique.mockResolvedValue(baseUser);
      await expect(svc.getById("u1")).resolves.toEqual(baseUser);
      expect(uFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "u1" } }),
      );
    });

    it("throws NotFound when missing", async () => {
      uFindUnique.mockResolvedValue(null);
      await expect(svc.getById("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    it("normalizes email and creates user (with tenant connect)", async () => {
      uFindFirst.mockResolvedValue(null); // duplicate pre-check (if used)
      uCreate.mockResolvedValue(baseUser);

      const result = await svc.create({
        email: "Alice@Example.com",
        name: "Alice",
        tenantId: "t1",
        hasServeAccess: false,
        hasFamilyAccess: false,
      });

      // Duplicate pre-check may use findFirst or findUnique depending on impl
      expect(uCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "alice@example.com",
            tenant: { connect: { id: "t1" } },
          }),
        }),
      );
      expect(result).toEqual(baseUser);
    });

    it("connects children when provided (and all exist in same tenant)", async () => {
      uFindFirst.mockResolvedValue(null);
      cFindMany.mockResolvedValue([
        { id: "c1", tenantId: "t1" },
        { id: "c2", tenantId: "t1" },
      ]);
      uCreate.mockResolvedValue(baseUser);

      await svc.create({
        email: "bob@example.com",
        name: "Bob",
        tenantId: "t1",
        hasServeAccess: false,
        hasFamilyAccess: false,
        children: ["c1", "c2"],
      });

      const call = uCreate.mock.calls[0][0];
      expect(call.data.children.connect).toEqual([{ id: "c1" }, { id: "c2" }]);
    });

    it("400 when any child id is missing", async () => {
      uFindFirst.mockResolvedValue(null);
      cFindMany.mockResolvedValue([{ id: "c1", tenantId: "t1" }]); // c2 missing

      await expect(
        svc.create({
          email: "x@example.com",
          name: "X",
          tenantId: "t1",
          hasServeAccess: false,
          hasFamilyAccess: false,
          children: ["c1", "c2"],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(uCreate).not.toHaveBeenCalled();
    });

    it("400 when any child is cross-tenant", async () => {
      uFindFirst.mockResolvedValue(null);
      cFindMany.mockResolvedValue([{ id: "c9", tenantId: "t9" }]);

      await expect(
        svc.create({
          email: "y@example.com",
          name: "Y",
          tenantId: "t1",
          hasServeAccess: false,
          hasFamilyAccess: false,
          children: ["c9"],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(uCreate).not.toHaveBeenCalled();
    });

    it("throws BadRequest when duplicate email (pre-check)", async () => {
      uFindFirst.mockResolvedValue(null); // service may not use findFirst
      uFindUnique.mockResolvedValue(baseUser); // duplicate exists
      await expect(
        svc.create({
          email: "alice@example.com",
          name: "Alice",
          tenantId: "t1",
          hasServeAccess: false,
          hasFamilyAccess: false,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(uCreate).not.toHaveBeenCalled();
    });

    it("throws BadRequest when unique constraint race (P2002)", async () => {
      uFindFirst.mockResolvedValue(null);
      const p2002 = Object.assign(new Error("Unique constraint"), {
        code: "P2002",
      });
      uCreate.mockRejectedValue(p2002);

      await expect(
        svc.create({
          email: "alice@example.com",
          name: "Alice",
          tenantId: "t1",
          hasServeAccess: false,
          hasFamilyAccess: false,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws BadRequest for invalid email (ZodError mapping)", async () => {
      await expect(
        svc.create({
          email: "not-an-email",
          name: "Alice",
          tenantId: "t1",
          hasServeAccess: false,
          hasFamilyAccess: false,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(uCreate).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("updates user fields and returns selection", async () => {
      uFindUnique.mockResolvedValue({ tenantId: "t1" });
      uUpdate.mockResolvedValue({ ...baseUser, name: "Alice Updated" });
      const result = await svc.update("u1", { name: "Alice Updated" });
      expect(uUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "u1" },
          data: expect.objectContaining({ name: "Alice Updated" }),
        }),
      );
      expect(result.name).toBe("Alice Updated");
    });

    it("lowercases email on update when provided", async () => {
      uFindUnique.mockResolvedValue({ tenantId: "t1" });
      uUpdate.mockResolvedValue({ ...baseUser, email: "bob@example.com" });
      await svc.update("u1", { email: "Bob@Example.com" });
      const args = uUpdate.mock.calls[0][0];
      expect(args.data.email).toBe("bob@example.com");
    });

    it("replaces children set when provided (same tenant)", async () => {
      // service should load current user for tenant; mock it
      uFindUnique.mockResolvedValue({ tenantId: "t1" });
      cFindMany.mockResolvedValue([{ id: "c3", tenantId: "t1" }]);
      uUpdate.mockResolvedValue({ ...baseUser, name: "A" });

      await svc.update("u1", { children: ["c3"] });
      const args = uUpdate.mock.calls[0][0];
      expect(args.data.children.set).toEqual([{ id: "c3" }]);
    });

    it("404 when user not found before validation", async () => {
      uFindUnique.mockResolvedValue(null);
      await expect(svc.update("missing", { name: "X" })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(uUpdate).not.toHaveBeenCalled();
    });

    it("400 when updating children with missing ids", async () => {
      uFindUnique.mockResolvedValue({ tenantId: "t1" });
      cFindMany.mockResolvedValue([{ id: "c1", tenantId: "t1" }]); // c2 missing
      await expect(
        svc.update("u1", { children: ["c1", "c2"] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(uUpdate).not.toHaveBeenCalled();
    });

    it("400 when updating children cross-tenant (target tenant is current)", async () => {
      uFindUnique.mockResolvedValue({ tenantId: "t1" });
      cFindMany.mockResolvedValue([{ id: "c9", tenantId: "t9" }]);
      await expect(
        svc.update("u1", { children: ["c9"] }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(uUpdate).not.toHaveBeenCalled();
    });

    it("throws BadRequest on unique email conflict (P2002)", async () => {
      const p2002 = Object.assign(new Error("Unique"), { code: "P2002" });
      uUpdate.mockRejectedValue(p2002);
      await expect(
        svc.update("u1", { email: "dup@example.com" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws NotFound on missing user (P2025) when update bubbles", async () => {
      const p2025 = Object.assign(new Error("Missing"), { code: "P2025" });
      uUpdate.mockRejectedValue(p2025);
      await expect(svc.update("missing", { name: "X" })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
