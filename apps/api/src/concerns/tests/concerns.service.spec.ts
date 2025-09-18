import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ConcernsService } from "../concerns.service";

// Types used in tests
interface Concern {
  id: string;
  childId: string;
  summary: string;
  details: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Prisma mocks (single-argument wrappers to avoid TS tuple spread issues)
const childFindUnique = jest.fn<Promise<{ id: string } | null>, [unknown]>();
const concernCreate = jest.fn<Promise<Concern>, [unknown]>();
const concernUpdate = jest.fn<Promise<Concern>, [unknown]>();
const concernDelete = jest.fn<Promise<{ id: string }>, [unknown]>();
const concernFindUnique = jest.fn<Promise<Concern | null>, [unknown]>();
const concernFindMany = jest.fn<Promise<Concern[]>, [unknown]>();

jest.mock("@pathway/db", () => ({
  prisma: {
    child: { findUnique: (arg: unknown) => childFindUnique(arg) },
    concern: {
      create: (arg: unknown) => concernCreate(arg),
      update: (arg: unknown) => concernUpdate(arg),
      delete: (arg: unknown) => concernDelete(arg),
      findUnique: (arg: unknown) => concernFindUnique(arg),
      findMany: (arg: unknown) => concernFindMany(arg),
    },
  },
}));

describe("ConcernsService", () => {
  let service: ConcernsService;
  const childId = "11111111-1111-1111-1111-111111111111";
  const concernId = "22222222-2222-2222-2222-222222222222";

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ConcernsService();
  });

  describe("create", () => {
    it("creates a concern when child exists", async () => {
      childFindUnique.mockResolvedValue({ id: childId });
      const created: Concern = {
        id: concernId,
        childId,
        summary: "Behavioural issue",
        details: "Talked during class",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      concernCreate.mockResolvedValue(created);

      const res = await service.create({
        childId,
        summary: "Behavioural issue",
        details: "Talked during class",
      });
      expect(childFindUnique).toHaveBeenCalledWith({
        where: { id: childId },
        select: { id: true },
      });
      expect(concernCreate).toHaveBeenCalled();
      expect(res).toEqual(created);
    });

    it("throws NotFound when child missing", async () => {
      childFindUnique.mockResolvedValue(null);
      await expect(
        service.create({ childId, summary: "x" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(concernCreate).not.toHaveBeenCalled();
    });

    it("maps Prisma FK error to BadRequest", async () => {
      childFindUnique.mockResolvedValue({ id: childId });
      concernCreate.mockRejectedValue({ code: "P2003", message: "fk" });
      await expect(
        service.create({ childId, summary: "x" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("findAll", () => {
    it("passes filters to prisma and returns list", async () => {
      const items: Concern[] = [
        {
          id: concernId,
          childId,
          summary: "s",
          details: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      concernFindMany.mockResolvedValue(items);
      const res = await service.findAll({ childId });
      expect(concernFindMany).toHaveBeenCalled();
      expect(Array.isArray(res)).toBe(true);
      expect(res[0].childId).toBe(childId);
    });
  });

  describe("findOne", () => {
    it("returns concern when found", async () => {
      const item: Concern = {
        id: concernId,
        childId,
        summary: "s",
        details: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      concernFindUnique.mockResolvedValue(item);
      const res = await service.findOne(concernId);
      expect(res).toEqual(item);
    });

    it("throws NotFound when missing", async () => {
      concernFindUnique.mockResolvedValue(null);
      await expect(service.findOne(concernId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("updates and returns concern", async () => {
      const updated: Concern = {
        id: concernId,
        childId,
        summary: "updated",
        details: "d",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      concernUpdate.mockResolvedValue(updated);
      const res = await service.update(concernId, {
        summary: "updated",
        details: "d",
      });
      expect(concernUpdate).toHaveBeenCalled();
      expect(res).toEqual(updated);
    });

    it("maps P2025 to NotFound on update", async () => {
      concernUpdate.mockRejectedValue({ code: "P2025", message: "not found" });
      await expect(
        service.update(concernId, { summary: "x" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("remove", () => {
    it("deletes by id and returns payload", async () => {
      const deleted: { id: string } = { id: concernId };
      concernDelete.mockResolvedValue(deleted);
      const res = await service.remove(concernId);
      expect(res).toEqual(deleted);
    });

    it("maps P2025 to NotFound on delete", async () => {
      concernDelete.mockRejectedValue({ code: "P2025", message: "not found" });
      await expect(service.remove(concernId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("maps P2003 to BadRequest on delete", async () => {
      concernDelete.mockRejectedValue({ code: "P2003", message: "fk" });
      await expect(service.remove(concernId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
