// Define Jest fns first so they can be referenced in the mock factory
const findMany = jest.fn();
const findUnique = jest.fn();
const create = jest.fn();
const update = jest.fn();

const tFindUnique = jest.fn(); // tenant
const gFindUnique = jest.fn(); // group
const uFindMany = jest.fn(); // users (guardians)

// Mock @pathway/db at top-level (hoisted by Jest) so imports use the mock
jest.mock("@pathway/db", () => ({
  prisma: {
    child: { findMany, findUnique, create, update },
    tenant: { findUnique: tFindUnique },
    group: { findUnique: gFindUnique },
    user: { findMany: uFindMany },
    $disconnect: jest.fn(),
  },
}));

import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ChildrenService } from "../../children/children.service";

describe("ChildrenService", () => {
  let svc: ChildrenService;

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new ChildrenService();
  });

  describe("list", () => {
    it("returns children (optionally by tenant)", async () => {
      findMany.mockResolvedValueOnce([]);
      const res = await svc.list();
      expect(res).toEqual([]);
      expect(findMany).toHaveBeenCalledWith({
        where: undefined,
        select: expect.any(Object),
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });

      findMany.mockResolvedValueOnce([]);
      await svc.list("t1");
      expect(findMany).toHaveBeenLastCalledWith({
        where: { tenantId: "t1" },
        select: expect.any(Object),
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });
    });
  });

  describe("getById", () => {
    it("returns a child when found", async () => {
      const child = { id: "c1" };
      findUnique.mockResolvedValueOnce(child);
      const res = await svc.getById("c1");
      expect(res).toBe(child);
      expect(findUnique).toHaveBeenCalledWith({
        where: { id: "c1" },
        select: expect.any(Object),
      });
    });

    it("throws NotFound when missing", async () => {
      findUnique.mockResolvedValueOnce(null);
      await expect(svc.getById("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    const baseDto = {
      firstName: "Jess",
      lastName: "Doe",
      allergies: "peanuts",
      tenantId: "t-11111111-1111-1111-1111-111111111111".slice(2), // uuid-like
    } as const;

    it("creates child with tenant only", async () => {
      tFindUnique.mockResolvedValueOnce({ id: baseDto.tenantId });
      create.mockResolvedValueOnce({ id: "c1", ...baseDto, groupId: null });

      const res = await svc.create({ ...baseDto });
      expect(res).toMatchObject({
        id: "c1",
        firstName: "Jess",
        lastName: "Doe",
        tenantId: baseDto.tenantId,
      });
      expect(create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          firstName: "Jess",
          lastName: "Doe",
          allergies: "peanuts",
          tenant: { connect: { id: baseDto.tenantId } },
        }),
        select: expect.any(Object),
      });
    });

    it("validates group belongs to same tenant", async () => {
      tFindUnique.mockResolvedValueOnce({ id: baseDto.tenantId });
      gFindUnique.mockResolvedValueOnce({ id: "g1", tenantId: "other-tenant" });

      await expect(svc.create({ ...baseDto, groupId: "g1" })).rejects.toEqual(
        new BadRequestException("group does not belong to tenant"),
      );
    });

    it("validates guardians belong to tenant and exist", async () => {
      tFindUnique.mockResolvedValueOnce({ id: baseDto.tenantId });
      gFindUnique.mockResolvedValueOnce({
        id: "g1",
        tenantId: baseDto.tenantId,
      });

      // IDs used across subcases
      const gid1 = "11111111-1111-1111-1111-111111111111";
      const gid2 = "22222222-2222-2222-2222-222222222222";

      // Case: some not found
      uFindMany.mockResolvedValueOnce([
        { id: gid1, tenantId: baseDto.tenantId },
      ]);
      await expect(
        svc.create({ ...baseDto, groupId: "g1", guardianIds: [gid1, gid2] }),
      ).rejects.toEqual(
        new BadRequestException("one or more guardians not found"),
      );

      // Case: cross-tenant
      tFindUnique.mockResolvedValueOnce({ id: baseDto.tenantId });
      gFindUnique.mockResolvedValueOnce({
        id: "g1",
        tenantId: baseDto.tenantId,
      });
      uFindMany.mockResolvedValueOnce([
        { id: gid1, tenantId: baseDto.tenantId },
        { id: gid2, tenantId: "other" },
      ]);
      await expect(
        svc.create({ ...baseDto, groupId: "g1", guardianIds: [gid1, gid2] }),
      ).rejects.toEqual(
        new BadRequestException("guardian does not belong to tenant"),
      );

      // Case: valid and creates with connect
      tFindUnique.mockResolvedValueOnce({ id: baseDto.tenantId });
      gFindUnique.mockResolvedValueOnce({
        id: "g1",
        tenantId: baseDto.tenantId,
      });
      uFindMany.mockResolvedValueOnce([
        { id: gid1, tenantId: baseDto.tenantId },
        { id: gid2, tenantId: baseDto.tenantId },
      ]);
      create.mockResolvedValueOnce({ id: "c2", ...baseDto, groupId: "g1" });

      const res = await svc.create({
        ...baseDto,
        groupId: "g1",
        guardianIds: [gid1, gid2],
      });
      expect(res.id).toBe("c2");
      expect(create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          group: { connect: { id: "g1" } },
          guardians: { connect: [{ id: gid1 }, { id: gid2 }] },
        }),
        select: expect.any(Object),
      });
    });

    it("throws when tenant not found", async () => {
      tFindUnique.mockResolvedValueOnce(null);
      await expect(svc.create({ ...baseDto })).rejects.toEqual(
        new BadRequestException("tenant not found"),
      );
    });
  });

  describe("update", () => {
    const childId = "c-11111111-1111-1111-1111-111111111111".slice(2); // uuid-like

    it("updates standard fields", async () => {
      findUnique.mockResolvedValueOnce({ id: childId, tenantId: "t1" });
      update.mockResolvedValueOnce({
        id: childId,
        firstName: "New",
        lastName: "Name",
        tenantId: "t1",
      });

      const res = await svc.update(childId, {
        firstName: " New ",
        lastName: " Name ",
      });
      expect(res).toMatchObject({
        id: childId,
        firstName: "New",
        lastName: "Name",
      });
      expect(update).toHaveBeenCalledWith({
        where: { id: childId },
        data: expect.objectContaining({ firstName: "New", lastName: "Name" }),
        select: expect.any(Object),
      });
    });

    it("validates group tenant on update", async () => {
      findUnique.mockResolvedValueOnce({ id: childId, tenantId: "t1" });
      gFindUnique.mockResolvedValueOnce({ id: "g1", tenantId: "t2" });

      await expect(svc.update(childId, { groupId: "g1" })).rejects.toEqual(
        new BadRequestException("group does not belong to tenant"),
      );
    });

    it("replaces guardians set when provided", async () => {
      const gid1 = "11111111-1111-1111-1111-111111111111";
      const gid2 = "22222222-2222-2222-2222-222222222222";

      findUnique.mockResolvedValueOnce({ id: childId, tenantId: "t1" });
      uFindMany.mockResolvedValueOnce([
        { id: gid1, tenantId: "t1" },
        { id: gid2, tenantId: "t1" },
      ]);
      update.mockResolvedValueOnce({ id: childId, tenantId: "t1" });

      await svc.update(childId, { guardianIds: [gid1, gid2] });
      expect(update).toHaveBeenCalledWith({
        where: { id: childId },
        data: expect.objectContaining({
          guardians: { set: [{ id: gid1 }, { id: gid2 }] },
        }),
        select: expect.any(Object),
      });
    });

    it("throws NotFound if child missing on update", async () => {
      findUnique.mockResolvedValueOnce(null);
      await expect(
        svc.update("missing", { firstName: "x" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
