import { BadRequestException, NotFoundException } from "@nestjs/common";
import { UsersService } from "../../users/users.service";

// Mock Prisma module-first, then grab fns from the mocked export
jest.mock("@pathway/db", () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from "@pathway/db";
const findMany = prisma.user.findMany as unknown as jest.Mock;
const findUnique = prisma.user.findUnique as unknown as jest.Mock;
const create = prisma.user.create as unknown as jest.Mock;
const update = prisma.user.update as unknown as jest.Mock;

describe("UsersService", () => {
  let svc: UsersService;

  const now = new Date();
  const user = {
    id: "u1",
    email: "alice@example.com",
    name: "Alice",
    createdAt: now,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new UsersService();
  });

  describe("list", () => {
    it("returns users", async () => {
      findMany.mockResolvedValue([user]);
      await expect(svc.list()).resolves.toEqual([user]);
      expect(findMany).toHaveBeenCalledWith({
        select: { id: true, email: true, name: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("getById", () => {
    it("returns a user when found", async () => {
      findUnique.mockResolvedValue(user);
      await expect(svc.getById("u1")).resolves.toEqual(user);
      expect(findUnique).toHaveBeenCalledWith({
        where: { id: "u1" },
        select: { id: true, email: true, name: true, createdAt: true },
      });
    });

    it("throws NotFound when missing", async () => {
      findUnique.mockResolvedValue(null);
      await expect(svc.getById("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    it("normalizes email and creates user (with tenant connect)", async () => {
      findUnique.mockResolvedValue(null); // duplicate pre-check
      create.mockResolvedValue(user);

      const result = await svc.create({
        email: "Alice@Example.com",
        name: "Alice",
        tenantId: "t1",
      });

      expect(findUnique).toHaveBeenCalledWith({
        where: { email: "alice@example.com" },
      });
      expect(create).toHaveBeenCalledWith({
        data: {
          email: "alice@example.com",
          name: "Alice",
          tenant: { connect: { id: "t1" } },
        },
        select: { id: true, email: true, name: true, createdAt: true },
      });
      expect(result).toEqual(user);
    });

    it("throws BadRequest when duplicate email (pre-check)", async () => {
      findUnique.mockResolvedValue(user); // already exists
      await expect(
        svc.create({
          email: "alice@example.com",
          name: "Alice",
          tenantId: "t1",
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(create).not.toHaveBeenCalled();
    });

    it("throws BadRequest when unique constraint race (P2002)", async () => {
      findUnique.mockResolvedValue(null);
      const p2002 = Object.assign(new Error("Unique constraint"), {
        code: "P2002",
      });
      create.mockRejectedValue(p2002);

      await expect(
        svc.create({
          email: "alice@example.com",
          name: "Alice",
          tenantId: "t1",
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws BadRequest for invalid email (ZodError mapping)", async () => {
      await expect(
        // invalid email triggers Zod validation -> BadRequestException via service
        svc.create({ email: "not-an-email", name: "Alice", tenantId: "t1" }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("updates user fields and returns selection", async () => {
      update.mockResolvedValue({ ...user, name: "Alice Updated" });
      const result = await svc.update("u1", { name: "Alice Updated" });
      expect(update).toHaveBeenCalledWith({
        where: { id: "u1" },
        data: { name: "Alice Updated" },
        select: { id: true, email: true, name: true, createdAt: true },
      });
      expect(result.name).toBe("Alice Updated");
    });

    it("lowercases email on update when provided", async () => {
      update.mockResolvedValue({ ...user, email: "bob@example.com" });
      await svc.update("u1", { email: "Bob@Example.com" });
      // We don't assert normalized object directly (handled inside service),
      // but we ensure update is called with lowercased email.
      const args = update.mock.calls[0][0];
      expect(args.data.email).toBe("bob@example.com");
    });

    it("throws BadRequest on unique email conflict (P2002)", async () => {
      const p2002 = Object.assign(new Error("Unique"), { code: "P2002" });
      update.mockRejectedValue(p2002);
      await expect(
        svc.update("u1", { email: "dup@example.com" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws NotFound on missing user (P2025)", async () => {
      const p2025 = Object.assign(new Error("Missing"), { code: "P2025" });
      update.mockRejectedValue(p2025);
      await expect(svc.update("missing", { name: "X" })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
