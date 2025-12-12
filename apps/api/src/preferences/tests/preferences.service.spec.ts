import { Test, TestingModule } from "@nestjs/testing";
import { PreferencesService } from "../preferences.service";
import { prisma, Weekday } from "@pathway/db";

// A concrete type for the model we return in tests
interface Preference {
  id: string;
  userId: string;
  tenantId: string;
  weekday: Weekday;
  startMinute: number;
  endMinute: number;
  createdAt: Date;
  updatedAt: Date;
}

describe("PreferencesService", () => {
  let service: PreferencesService;

  const now = new Date("2025-01-01T12:00:00.000Z");
  const tenantId = "t1";
  const base: Preference = {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    userId: "11111111-1111-1111-1111-111111111111",
    tenantId,
    weekday: Weekday.MON,
    startMinute: 9 * 60,
    endMinute: 11 * 60,
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PreferencesService],
    }).compile();

    service = module.get<PreferencesService>(PreferencesService);
  });

  describe("create", () => {
    it("should create a preference", async () => {
      jest.spyOn(prisma.volunteerPreference, "create").mockResolvedValue(base);

      const created = await service.create(
        {
          userId: base.userId,
          tenantId: base.tenantId,
          weekday: base.weekday,
          startMinute: base.startMinute,
          endMinute: base.endMinute,
        },
        tenantId,
      );

      expect(prisma.volunteerPreference.create).toHaveBeenCalledWith({
        data: {
          userId: base.userId,
          tenantId,
          weekday: base.weekday,
          startMinute: base.startMinute,
          endMinute: base.endMinute,
        },
      });
      expect(created).toEqual(base);
    });
  });

  describe("findAll", () => {
    it("should list preferences with tenant filter", async () => {
      jest
        .spyOn(prisma.volunteerPreference, "findMany")
        .mockResolvedValue([base]);

      const list = await service.findAll({ tenantId });

      expect(prisma.volunteerPreference.findMany).toHaveBeenCalledWith({
        where: {
          userId: undefined,
          tenantId,
          weekday: undefined,
          startMinute: undefined,
          endMinute: undefined,
        },
        orderBy: { createdAt: "desc" },
      });
      expect(list).toEqual([base]);
    });

    it("should list with filters and ranges", async () => {
      jest
        .spyOn(prisma.volunteerPreference, "findMany")
        .mockResolvedValue([base]);

      const list = await service.findAll({
        userId: base.userId,
        tenantId,
        weekday: Weekday.MON,
        startMinuteGte: 8 * 60,
        endMinuteLte: 12 * 60,
      });

      expect(prisma.volunteerPreference.findMany).toHaveBeenCalledWith({
        where: {
          userId: base.userId,
          tenantId,
          weekday: Weekday.MON,
          startMinute: { gte: 8 * 60 },
          endMinute: { lte: 12 * 60 },
        },
        orderBy: { createdAt: "desc" },
      });
      expect(list).toEqual([base]);
    });
  });

  describe("findOne", () => {
    it("should get a single preference by id", async () => {
      jest
        .spyOn(prisma.volunteerPreference, "findFirst")
        .mockResolvedValue(base);

      const found = await service.findOne(base.id, tenantId);

      expect(prisma.volunteerPreference.findFirst).toHaveBeenCalledWith({
        where: { id: base.id, tenantId },
      });
      expect(found).toEqual(base);
    });
  });

  describe("update", () => {
    it("should update a preference", async () => {
      jest.spyOn(prisma.volunteerPreference, "update").mockResolvedValue(base);

      const patch = { weekday: Weekday.TUE, endMinute: 12 * 60 + 30 };
      const res = await service.update(base.id, patch, tenantId);

      expect(prisma.volunteerPreference.update).toHaveBeenCalledWith({
        where: { id: base.id },
        data: {
          tenantId,
          weekday: patch.weekday as Weekday | undefined,
          endMinute: patch.endMinute,
        },
      });
      expect(res).toEqual(base);
    });
  });

  describe("remove", () => {
    it("should delete a preference", async () => {
      jest
        .spyOn(prisma.volunteerPreference, "deleteMany")
        .mockResolvedValue({ count: 1 });

      const res = await service.remove(base.id, tenantId);
      expect(prisma.volunteerPreference.deleteMany).toHaveBeenCalledWith({
        where: { id: base.id, tenantId },
      });
      expect(res).toEqual({ count: 1 });
    });
  });
});
