import "reflect-metadata";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { SessionsService } from "../sessions.service";
import { prisma as realPrisma } from "@pathway/db";
import type { Prisma } from "@pathway/db";

// Narrow the Prisma shape we use here for strong typing in mocks
type SessionRow = {
  id: string;
  tenantId: string;
  groupId: string | null;
  startsAt: Date;
  endsAt: Date;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
};

describe("SessionsService", () => {
  // Strictly typed jest mocks for the prisma.session API we use
  const sFindMany = jest.fn() as jest.MockedFunction<
    (args?: Prisma.SessionFindManyArgs) => Promise<SessionRow[]>
  >;
  const sFindFirst = jest.fn() as jest.MockedFunction<
    (args: Prisma.SessionFindFirstArgs) => Promise<SessionRow | null>
  >;
  const sCreate = jest.fn() as jest.MockedFunction<
    (args: Prisma.SessionCreateArgs) => Promise<SessionRow>
  >;
  const sUpdate = jest.fn() as jest.MockedFunction<
    (args: Prisma.SessionUpdateArgs) => Promise<SessionRow>
  >;

  const tFindUnique = jest.fn() as jest.MockedFunction<
    (args: Prisma.TenantFindUniqueArgs) => Promise<{ id: string } | null>
  >;
  const gFindUnique = jest.fn() as jest.MockedFunction<
    (
      args: Prisma.GroupFindUniqueArgs,
    ) => Promise<{ id: string; tenantId: string } | null>
  >;

  const svc = new SessionsService();

  const now = new Date("2025-09-13T12:00:00Z");
  const later = new Date("2025-09-13T13:00:00Z");

  const ids = {
    tenant: "11111111-1111-1111-1111-111111111111",
    group: "33333333-3333-3333-3333-333333333333",
  } as const;

  const base: SessionRow = {
    id: "sess-1",
    tenantId: ids.tenant,
    groupId: ids.group,
    startsAt: now,
    endsAt: later,
    title: "Sunday 11am",
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Wire our jest fns into the real prisma client via spies
    jest
      .spyOn(realPrisma.session, "findMany")
      .mockImplementation(
        sFindMany as unknown as typeof realPrisma.session.findMany,
      );
    jest
      .spyOn(realPrisma.session, "findFirst")
      .mockImplementation(
        sFindFirst as unknown as typeof realPrisma.session.findFirst,
      );
    jest
      .spyOn(realPrisma.session, "create")
      .mockImplementation(
        sCreate as unknown as typeof realPrisma.session.create,
      );
    jest
      .spyOn(realPrisma.session, "update")
      .mockImplementation(
        sUpdate as unknown as typeof realPrisma.session.update,
      );

    jest
      .spyOn(realPrisma.tenant, "findUnique")
      .mockImplementation(
        tFindUnique as unknown as typeof realPrisma.tenant.findUnique,
      );
    jest
      .spyOn(realPrisma.group, "findUnique")
      .mockImplementation(
        gFindUnique as unknown as typeof realPrisma.group.findUnique,
      );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("list", () => {
    it("returns sessions (optionally filtered)", async () => {
      sFindMany.mockResolvedValue([base]);

      const resAll = await svc.list({ tenantId: ids.tenant });
      expect(Array.isArray(resAll)).toBe(true);
      expect(resAll[0].id).toBe(base.id);
      expect(sFindMany).toHaveBeenLastCalledWith({
        where: { tenantId: ids.tenant },
        orderBy: { startsAt: "asc" },
      });
    });
  });

  describe("getById", () => {
    it("returns a session when found", async () => {
      sFindFirst.mockResolvedValue(base);
      const res = await svc.getById(base.id, ids.tenant);
      expect(res.id).toBe(base.id);
      expect(sFindFirst).toHaveBeenCalledWith({
        where: { id: base.id, tenantId: ids.tenant },
      });
    });

    it("throws NotFound when missing", async () => {
      sFindFirst.mockResolvedValue(null);
      await expect(svc.getById("missing", ids.tenant)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    it("validates tenant exists and optional group belongs to tenant; creates row", async () => {
      tFindUnique.mockResolvedValue({ id: ids.tenant });
      gFindUnique.mockResolvedValue({ id: ids.group, tenantId: ids.tenant });
      sCreate.mockResolvedValue(base);

      const res = await svc.create(
        {
          tenantId: ids.tenant,
          groupId: ids.group,
          startsAt: now,
          endsAt: later,
          title: "Sunday 11am",
        },
        ids.tenant,
      );

      expect(res.id).toBe(base.id);
      expect(sCreate).toHaveBeenCalledWith({
        data: {
          tenantId: ids.tenant,
          groupId: ids.group,
          startsAt: now,
          endsAt: later,
          title: "Sunday 11am",
        },
      });
    });

    it("rejects when startsAt >= endsAt", async () => {
      await expect(
        svc.create(
          { tenantId: ids.tenant, startsAt: later, endsAt: later },
          ids.tenant,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects when tenant missing", async () => {
      tFindUnique.mockResolvedValue(null);
      await expect(
        svc.create(
          {
            tenantId: "99999999-9999-9999-9999-999999999999",
            startsAt: now,
            endsAt: later,
          },
          "99999999-9999-9999-9999-999999999999",
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects when group belongs to different tenant", async () => {
      tFindUnique.mockResolvedValue({ id: ids.tenant });
      gFindUnique.mockResolvedValue({ id: ids.group, tenantId: "other" });
      await expect(
        svc.create(
          {
            tenantId: ids.tenant,
            groupId: ids.group,
            startsAt: now,
            endsAt: later,
          },
          ids.tenant,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("update", () => {
    it("updates fields and validates times and group tenant", async () => {
      sFindFirst.mockResolvedValue(base);
      gFindUnique.mockResolvedValue({ id: ids.group, tenantId: ids.tenant });
      const updated: SessionRow = {
        ...base,
        title: "Updated",
        updatedAt: new Date(now.getTime() + 1000),
      };
      sUpdate.mockResolvedValue(updated);

      const res = await svc.update(base.id, { title: "Updated" }, ids.tenant);
      expect(res.title).toBe("Updated");
      expect(sUpdate).toHaveBeenCalledWith({
        where: { id: base.id },
        data: expect.objectContaining({ title: "Updated" }),
      });
    });

    it("throws NotFound when session missing", async () => {
      sFindFirst.mockResolvedValue(null);
      await expect(
        svc.update("missing", { title: "x" }, ids.tenant),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("rejects when new times are invalid", async () => {
      sFindFirst.mockResolvedValue(base);
      await expect(
        svc.update(base.id, { startsAt: later, endsAt: now }, ids.tenant),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects when new group is cross-tenant", async () => {
      sFindFirst.mockResolvedValue(base);
      gFindUnique.mockResolvedValue({ id: "g2", tenantId: "other" });
      await expect(
        svc.update(base.id, { groupId: "g2" }, ids.tenant),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
