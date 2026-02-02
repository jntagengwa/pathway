import { BadRequestException, NotFoundException } from "@nestjs/common";
import { GroupsService } from "../../groups/groups.service";
import type { CreateGroupDto } from "../../groups/dto/create-group.dto";
import type { UpdateGroupDto } from "../../groups/dto/update-group.dto";

const mockEntitlements = {
  resolve: jest.fn().mockResolvedValue({
    subscription: { planCode: "STARTER_MONTHLY" },
    flags: { planCode: "STARTER_MONTHLY" },
  }),
};

jest.mock("@pathway/db", () => ({
  prisma: {
    group: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from "@pathway/db";

const findMany = prisma.group.findMany as unknown as jest.Mock;
const findFirst = prisma.group.findFirst as unknown as jest.Mock;
const create = prisma.group.create as unknown as jest.Mock;
const update = prisma.group.update as unknown as jest.Mock;
const count = prisma.group.count as unknown as jest.Mock;
const tFindUnique = prisma.tenant.findUnique as unknown as jest.Mock;

describe("GroupsService", () => {
  let svc: GroupsService;

  const groupRow = {
    id: "g1",
    name: "Kids 7-9",
    tenantId: "t1",
    minAge: 7,
    maxAge: 9,
    description: null,
    isActive: true,
    sortOrder: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { sessions: 0 },
  };

  const tenantId = "t1";

  beforeEach(() => {
    jest.clearAllMocks();
    mockEntitlements.resolve.mockResolvedValue({
      subscription: { planCode: "STARTER_MONTHLY" },
      flags: { planCode: "STARTER_MONTHLY" },
    });
    svc = new GroupsService(mockEntitlements as never);
    tFindUnique.mockResolvedValue({ id: "t1", orgId: "o1" });
    count.mockResolvedValue(0);
  });

  describe("list", () => {
    it("returns groups with sessionsCount", async () => {
      findMany.mockResolvedValue([groupRow]);
      const result = await svc.list(tenantId);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "g1",
        name: "Kids 7-9",
        sessionsCount: 0,
      });
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        }),
      );
    });

    it("filters by activeOnly when requested", async () => {
      findMany.mockResolvedValue([]);
      await svc.list(tenantId, { activeOnly: true });
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId, isActive: true },
        }),
      );
    });
  });

  describe("getById", () => {
    it("returns a group when found", async () => {
      findFirst.mockResolvedValue({ ...groupRow, _count: { sessions: 2 } });
      const result = await svc.getById("g1", tenantId);
      expect(result).toMatchObject({
        id: "g1",
        name: "Kids 7-9",
        sessionsCount: 2,
      });
    });

    it("throws NotFound when missing", async () => {
      findFirst.mockResolvedValue(null);
      await expect(svc.getById("missing", tenantId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    it("creates with optional fields", async () => {
      findFirst.mockResolvedValue(null);
      create.mockResolvedValue({ ...groupRow, name: "Toddlers" });

      const dto: CreateGroupDto = {
        name: "Toddlers",
        tenantId,
        minAge: 3,
        maxAge: 5,
        isActive: true,
      };
      const result = await svc.create(dto, tenantId);

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: "Toddlers",
            minAge: 3,
            maxAge: 5,
            isActive: true,
            tenant: { connect: { id: tenantId } },
          }),
        }),
      );
      expect(result).toMatchObject({ name: "Toddlers" });
    });

    it("throws BadRequest when duplicate name", async () => {
      findFirst.mockResolvedValue(groupRow);
      await expect(
        svc.create(
          { name: "Kids 7-9", tenantId, minAge: 7, maxAge: 9 },
          tenantId,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(create).not.toHaveBeenCalled();
    });

    it("throws BadRequest when minAge > maxAge", async () => {
      findFirst.mockResolvedValue(null);
      await expect(
        svc.create(
          { name: "Bad", tenantId, minAge: 10, maxAge: 9 },
          tenantId,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(create).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("updates name and ages", async () => {
      findFirst.mockResolvedValue({ id: "g1", tenantId, isActive: true });
      update.mockResolvedValue({
        ...groupRow,
        name: "Kids 6-10",
        minAge: 6,
        maxAge: 10,
      });
      const payload: UpdateGroupDto = {
        name: "Kids 6-10",
        minAge: 6,
        maxAge: 10,
      };
      const result = await svc.update("g1", payload, tenantId);
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "g1" },
          data: payload,
        }),
      );
      expect(result).toMatchObject({
        name: "Kids 6-10",
        minAge: 6,
        maxAge: 10,
      });
    });

    it("throws BadRequest when invalid ages", async () => {
      findFirst.mockResolvedValue({ id: "g1", tenantId, isActive: true });
      const badPayload: UpdateGroupDto = { minAge: 10, maxAge: 9 };
      await expect(
        svc.update("g1", badPayload, tenantId),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(update).not.toHaveBeenCalled();
    });
  });
});
