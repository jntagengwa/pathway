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
  const base: Preference = {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    userId: "11111111-1111-1111-1111-111111111111",
    tenantId: "22222222-2222-2222-2222-222222222222",
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

      const created = await service.create({
        userId: base.userId,
        tenantId: base.tenantId,
        weekday: base.weekday,
        startMinute: base.startMinute,
        endMinute: base.endMinute,
      });

      expect(prisma.volunteerPreference.create).toHaveBeenCalledWith({
        data: {
          userId: base.userId,
          tenantId: base.tenantId,
          weekday: base.weekday,
          startMinute: base.startMinute,
          endMinute: base.endMinute,
        },
      });
      expect(created).toEqual(base);
    });
  });

  describe("findAll", () => {
    it("should list preferences with no filters", async () => {
      jest
        .spyOn(prisma.volunteerPreference, "findMany")
        .mockResolvedValue([base]);

      const list = await service.findAll();

      expect(prisma.volunteerPreference.findMany).toHaveBeenCalledWith({
        where: {},
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
        tenantId: base.tenantId,
        weekday: Weekday.MON,
        startMinuteGte: 8 * 60,
        endMinuteLte: 12 * 60,
      });

      expect(prisma.volunteerPreference.findMany).toHaveBeenCalledWith({
        where: {
          userId: base.userId,
          tenantId: base.tenantId,
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
        .spyOn(prisma.volunteerPreference, "findUnique")
        .mockResolvedValue(base);

      const found = await service.findOne(base.id);

      expect(prisma.volunteerPreference.findUnique).toHaveBeenCalledWith({
        where: { id: base.id },
      });
      expect(found).toEqual(base);
    });
  });

  describe("update", () => {
    it("should update a preference", async () => {
      const updated: Preference = {
        ...base,
        weekday: Weekday.TUE,
        startMinute: 10 * 60,
        endMinute: 12 * 60,
        updatedAt: new Date(now.getTime() + 1000),
      };
      jest
        .spyOn(prisma.volunteerPreference, "update")
        .mockResolvedValue(updated);

      const res = await service.update(base.id, {
        weekday: Weekday.TUE,
        startMinute: 10 * 60,
        endMinute: 12 * 60,
      });

      expect(prisma.volunteerPreference.update).toHaveBeenCalledWith({
        where: { id: base.id },
        data: {
          weekday: Weekday.TUE,
          startMinute: 10 * 60,
          endMinute: 12 * 60,
        },
      });
      expect(res).toEqual(updated);
    });
  });

  describe("remove", () => {
    it("should delete a preference", async () => {
      jest.spyOn(prisma.volunteerPreference, "delete").mockResolvedValue(base);

      const res = await service.remove(base.id);
      expect(prisma.volunteerPreference.delete).toHaveBeenCalledWith({
        where: { id: base.id },
      });
      expect(res).toEqual(base);
    });
  });
});
