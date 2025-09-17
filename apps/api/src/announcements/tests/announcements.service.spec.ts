import { BadRequestException, NotFoundException } from "@nestjs/common";
import { AnnouncementsService, type Audience } from "../announcements.service";

// ---- Types used in tests
type Announcement = {
  id: string;
  tenantId: string;
  title: string;
  body: string;
  audience: Audience;
  publishedAt: Date | null;
};

// ---- Prisma mocks
const tenantFindUnique = jest.fn<Promise<{ id: string } | null>, [unknown]>();
const announcementCreate = jest.fn<Promise<Announcement>, [unknown]>();
const announcementUpdate = jest.fn<Promise<Announcement>, [unknown]>();
const announcementDelete = jest.fn<Promise<{ id: string }>, [unknown]>();
const announcementFindUnique = jest.fn<
  Promise<Announcement | null>,
  [unknown]
>();
const announcementFindMany = jest.fn<Promise<Announcement[]>, [unknown]>();

jest.mock("@pathway/db", () => ({
  prisma: {
    tenant: { findUnique: (arg: unknown) => tenantFindUnique(arg) },
    announcement: {
      create: (arg: unknown) => announcementCreate(arg),
      update: (arg: unknown) => announcementUpdate(arg),
      delete: (arg: unknown) => announcementDelete(arg),
      findUnique: (arg: unknown) => announcementFindUnique(arg),
      findMany: (arg: unknown) => announcementFindMany(arg),
    },
  },
}));

describe("AnnouncementsService", () => {
  let service: AnnouncementsService;
  const tenantId = "11111111-1111-1111-1111-111111111111";
  const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AnnouncementsService();
  });

  describe("create", () => {
    it("creates an announcement (valid tenant)", async () => {
      tenantFindUnique.mockResolvedValue({ id: tenantId });
      const created: Announcement = {
        id,
        tenantId,
        title: "Welcome",
        body: "We are live!",
        audience: "ALL",
        publishedAt: null,
      };
      announcementCreate.mockResolvedValue(created);

      const res = await service.create({
        tenantId,
        title: "Welcome",
        body: "We are live!",
        audience: "ALL",
      });

      expect(tenantFindUnique).toHaveBeenCalledWith({
        where: { id: tenantId },
        select: { id: true },
      });
      expect(announcementCreate).toHaveBeenCalled();
      expect(res).toEqual(created);
    });

    it("throws NotFound when tenant missing", async () => {
      tenantFindUnique.mockResolvedValue(null);
      await expect(
        service.create({ tenantId, title: "t", body: "b", audience: "ALL" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(announcementCreate).not.toHaveBeenCalled();
    });

    it("maps Prisma FK error to BadRequest", async () => {
      tenantFindUnique.mockResolvedValue({ id: tenantId });
      announcementCreate.mockRejectedValue({ code: "P2003", message: "fk" });
      await expect(
        service.create({ tenantId, title: "t", body: "b", audience: "ALL" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("findAll", () => {
    it("passes filters to prisma and returns list", async () => {
      const items: Announcement[] = [
        {
          id,
          tenantId,
          title: "Msg",
          body: "hello",
          audience: "PARENTS",
          publishedAt: new Date("2025-01-10T00:00:00.000Z"),
        },
      ];
      announcementFindMany.mockResolvedValue(items);

      const res = await service.findAll({
        tenantId,
        audience: "PARENTS",
        publishedOnly: true,
      });
      expect(announcementFindMany).toHaveBeenCalled();
      expect(Array.isArray(res)).toBe(true);
      expect(res[0].audience).toBe("PARENTS");
    });
  });

  describe("findOne", () => {
    it("returns item when found", async () => {
      const item: Announcement = {
        id,
        tenantId,
        title: "t",
        body: "b",
        audience: "ALL",
        publishedAt: null,
      };
      announcementFindUnique.mockResolvedValue(item);
      const res = await service.findOne(id);
      expect(res).toEqual(item);
    });

    it("throws NotFound when missing", async () => {
      announcementFindUnique.mockResolvedValue(null);
      await expect(service.findOne(id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("updates and returns announcement", async () => {
      const updated: Announcement = {
        id,
        tenantId,
        title: "Updated",
        body: "b",
        audience: "STAFF",
        publishedAt: null,
      };
      announcementUpdate.mockResolvedValue(updated);
      const res = await service.update(id, {
        title: "Updated",
        audience: "STAFF",
      });
      expect(announcementUpdate).toHaveBeenCalled();
      expect(res).toEqual(updated);
    });

    it("maps P2025 to NotFound", async () => {
      announcementUpdate.mockRejectedValue({
        code: "P2025",
        message: "not found",
      });
      await expect(
        service.update(id, { title: "Updated" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("remove", () => {
    it("deletes by id and returns payload", async () => {
      const deleted: { id: string } = { id };
      announcementDelete.mockResolvedValue(deleted);
      const res = await service.remove(id);
      expect(res).toEqual(deleted);
    });

    it("maps P2025 to NotFound on delete", async () => {
      announcementDelete.mockRejectedValue({
        code: "P2025",
        message: "not found",
      });
      await expect(service.remove(id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("maps P2003 to BadRequest on delete", async () => {
      announcementDelete.mockRejectedValue({ code: "P2003", message: "fk" });
      await expect(service.remove(id)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
