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
  runTransaction: jest.fn((fn: (tx: unknown) => Promise<unknown>) => {
    const mockTx = {
      user: { update: jest.fn().mockResolvedValue({}), findFirst: jest.fn() },
      siteMembership: { upsert: jest.fn().mockResolvedValue({}) },
      child: { update: jest.fn().mockResolvedValue({}) },
    };
    return fn(mockTx as never);
  }),
}));

const mockInvitesService = {
  createInvite: jest.fn(),
};

jest.mock("../../invites/invites.service", () => ({
  InvitesService: jest.fn().mockImplementation(() => mockInvitesService),
}));

import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ChildrenService } from "../../children/children.service";
import { InvitesService } from "../../invites/invites.service";

describe("ChildrenService", () => {
  let svc: ChildrenService;
  const tenantId = "t1";

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new ChildrenService(mockInvitesService as unknown as InvitesService);
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

  describe("getPhoto", () => {
    it("returns photo when consent and photoBytes", async () => {
      const buf = Buffer.from("fake-image-data");
      findFirst.mockResolvedValueOnce({
        photoConsent: true,
        photoBytes: buf,
        photoContentType: "image/jpeg",
        photoKey: null,
      });
      const res = await svc.getPhoto("c1", tenantId);
      expect(res).not.toBeNull();
      expect(res?.buffer).toEqual(buf);
      expect(res?.contentType).toBe("image/jpeg");
    });

    it("returns null when no consent", async () => {
      findFirst.mockResolvedValueOnce({
        photoConsent: false,
        photoBytes: Buffer.from("x"),
        photoContentType: "image/jpeg",
        photoKey: null,
      });
      const res = await svc.getPhoto("c1", tenantId);
      expect(res).toBeNull();
    });

    it("returns null when no photo bytes", async () => {
      findFirst.mockResolvedValueOnce({
        photoConsent: true,
        photoBytes: null,
        photoContentType: null,
        photoKey: null,
      });
      const res = await svc.getPhoto("c1", tenantId);
      expect(res).toBeNull();
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
