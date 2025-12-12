/* eslint-disable @typescript-eslint/no-explicit-any */
const findMany = jest.fn();
const findFirst = jest.fn();
const create = jest.fn();
const update = jest.fn();

const tFindUnique = jest.fn(); // tenant
const gFindUnique = jest.fn(); // group
const uFindMany = jest.fn(); // users (guardians)

jest.mock("@pathway/db", () => ({
  prisma: {
    child: { findMany, findFirst, create, update },
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
  const tenantId = "t1";

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new ChildrenService();
  });

  describe("list", () => {
    it("returns children by tenant", async () => {
      findMany.mockResolvedValueOnce([]);
      const res = await svc.list(tenantId);
      expect(res).toEqual([]);
      expect(findMany).toHaveBeenCalledWith({
        where: { tenantId },
        select: expect.any(Object),
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      });
    });
  });

  describe("getById", () => {
    it("returns child when found in tenant", async () => {
      const child = { id: "c1", tenantId };
      findFirst.mockResolvedValueOnce(child);
      const res = await svc.getById("c1", tenantId);
      expect(res).toBe(child);
      expect(findFirst).toHaveBeenCalledWith({
        where: { id: "c1", tenantId },
        select: expect.any(Object),
      });
    });

    it("404 when missing", async () => {
      findFirst.mockResolvedValueOnce(null);
      await expect(svc.getById("missing", tenantId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    const baseDto = {
      firstName: "Jess",
      lastName: "Doe",
      allergies: "peanuts",
    } as any;

    it("creates after validations", async () => {
      tFindUnique.mockResolvedValueOnce({ id: tenantId });
      gFindUnique.mockResolvedValueOnce({ id: "g1", tenantId });
      uFindMany.mockResolvedValueOnce([]);
      create.mockResolvedValueOnce({ id: "c1", tenantId });

      const res = await svc.create({ ...baseDto }, tenantId);
      expect(res).toHaveProperty("id", "c1");
      expect(create).toHaveBeenCalled();
    });

    it("errors when tenant missing", async () => {
      await expect(
        svc.create({ ...baseDto }, undefined as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("update", () => {
    it("updates when child exists in tenant", async () => {
      findFirst.mockResolvedValueOnce({ id: "c1", tenantId });
      gFindUnique.mockResolvedValueOnce({ id: "g1", tenantId });
      update.mockResolvedValueOnce({ id: "c1", tenantId, groupId: "g1" });

      const res = await svc.update("c1", { groupId: "g1" } as any, tenantId);
      expect(res).toHaveProperty("groupId", "g1");
      expect(update).toHaveBeenCalled();
    });

    it("404 when child not in tenant", async () => {
      findFirst.mockResolvedValueOnce(null);
      await expect(svc.update("missing", {}, tenantId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
