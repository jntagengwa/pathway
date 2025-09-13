import { BadRequestException, NotFoundException } from "@nestjs/common";
import { GroupsService } from "../../groups/groups.service";
import type { UpdateGroupDto } from "../../groups/dto/update-group.dto";

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
  },
}));

import { prisma } from "@pathway/db";
const findMany = prisma.group.findMany as unknown as jest.Mock;
const findUnique = prisma.group.findUnique as unknown as jest.Mock;
const findFirst = prisma.group.findFirst as unknown as jest.Mock;
const create = prisma.group.create as unknown as jest.Mock;
const update = prisma.group.update as unknown as jest.Mock;

describe("GroupsService", () => {
  let svc: GroupsService;

  const group = {
    id: "g1",
    name: "Kids 7-9",
    tenantId: "t1",
    minAge: 7,
    maxAge: 9,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new GroupsService();
  });

  describe("list", () => {
    it("returns groups", async () => {
      findMany.mockResolvedValue([group]);
      await expect(svc.list()).resolves.toEqual([group]);
      expect(findMany).toHaveBeenCalledWith({
        select: { id: true, name: true, tenantId: true },
        orderBy: { name: "asc" },
      });
    });
  });

  describe("getById", () => {
    it("returns a group when found", async () => {
      findUnique.mockResolvedValue(group);
      await expect(svc.getById("g1")).resolves.toEqual(group);
      expect(findUnique).toHaveBeenCalledWith({
        where: { id: "g1" },
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
      findUnique.mockResolvedValue(null);
      await expect(svc.getById("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    it("validates & creates with tenant connect", async () => {
      findFirst.mockResolvedValue(null); // no duplicate
      create.mockResolvedValue(group);

      const result = await svc.create({
        name: "Kids 7-9",
        tenantId: "t1",
        minAge: 7,
        maxAge: 9,
      });

      expect(findFirst).toHaveBeenCalledWith({
        where: { tenantId: "t1", name: "Kids 7-9" },
      });
      expect(create).toHaveBeenCalledWith({
        data: {
          name: "Kids 7-9",
          minAge: 7,
          maxAge: 9,
          tenant: { connect: { id: "t1" } },
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
      findFirst.mockResolvedValue(group);
      await expect(
        svc.create({ name: "Kids 7-9", tenantId: "t1", minAge: 7, maxAge: 9 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(create).not.toHaveBeenCalled();
    });

    it("throws BadRequest when unique constraint race (P2002)", async () => {
      findFirst.mockResolvedValue(null);
      const p2002 = Object.assign(new Error("Unique"), { code: "P2002" });
      create.mockRejectedValue(p2002);
      await expect(
        svc.create({ name: "Kids 7-9", tenantId: "t1", minAge: 7, maxAge: 9 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("throws BadRequest for invalid ages (min>max)", async () => {
      await expect(
        svc.create({ name: "Bad", tenantId: "t1", minAge: 10, maxAge: 9 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("updates name and ages", async () => {
      update.mockResolvedValue({
        ...group,
        name: "Kids 6-10",
        minAge: 6,
        maxAge: 10,
      });
      const payload: UpdateGroupDto = {
        name: "Kids 6-10",
        minAge: 6,
        maxAge: 10,
      };
      const result = await svc.update("g1", payload);
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
      const p2002 = Object.assign(new Error("Unique"), { code: "P2002" });
      update.mockRejectedValue(p2002);
      await expect(svc.update("g1", { name: "Dup" })).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("throws NotFound when group missing (P2025)", async () => {
      const p2025 = Object.assign(new Error("Missing"), { code: "P2025" });
      update.mockRejectedValue(p2025);
      await expect(svc.update("missing", { name: "X" })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("throws BadRequest when invalid ages provided", async () => {
      const badPayload: UpdateGroupDto = { minAge: 10, maxAge: 9 };
      await expect(svc.update("g1", badPayload)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(update).not.toHaveBeenCalled();
    });
  });
});
