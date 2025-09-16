import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { PreferencesController } from "../preferences.controller";
import { PreferencesService } from "../preferences.service";
import { Weekday } from "@pathway/db";

describe("PreferencesController", () => {
  let controller: PreferencesController;
  let service: jest.Mocked<PreferencesService>;

  const now = new Date("2025-01-01T12:00:00.000Z");

  const basePref = {
    id: "11111111-1111-1111-1111-111111111111",
    userId: "22222222-2222-2222-2222-222222222222",
    tenantId: "33333333-3333-3333-3333-333333333333",
    weekday: Weekday.MON,
    startMinute: 9 * 60, // 09:00
    endMinute: 12 * 60, // 12:00
    createdAt: now,
    updatedAt: now,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PreferencesController],
      providers: [
        {
          provide: PreferencesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PreferencesController>(PreferencesController);
    service = module.get(PreferencesService);
  });

  describe("create", () => {
    it("should validate body and call service.create", async () => {
      service.create.mockResolvedValue({ ...basePref });

      const dto = {
        userId: basePref.userId,
        tenantId: basePref.tenantId,
        weekday: Weekday.MON,
        startMinute: 540,
        endMinute: 600,
      };

      const result = await controller.create(dto);
      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(basePref);
    });

    it("should 400 when endMinute <= startMinute", async () => {
      const bad = {
        userId: basePref.userId,
        tenantId: basePref.tenantId,
        weekday: Weekday.MON,
        startMinute: 600,
        endMinute: 600,
      };

      await expect(controller.create(bad)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(service.create).not.toHaveBeenCalled();
    });
  });

  describe("findAll", () => {
    it("should call service.findAll with empty filters", async () => {
      const list = [{ ...basePref }];
      service.findAll.mockResolvedValue(list);

      const result = await controller.findAll();
      expect(service.findAll).toHaveBeenCalledWith();
      expect(result).toEqual(list);
    });
  });

  describe("findOne", () => {
    it("should validate id and call service.findOne", async () => {
      service.findOne.mockResolvedValue({ ...basePref });

      const result = await controller.findOne({ id: basePref.id });
      expect(service.findOne).toHaveBeenCalledWith(basePref.id);
      expect(result).toEqual(basePref);
    });

    it("should 400 on invalid uuid", async () => {
      await expect(
        controller.findOne({ id: "not-a-uuid" }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(service.findOne).not.toHaveBeenCalled();
    });
  });

  describe("update", () => {
    it("should validate id + body and call service.update", async () => {
      const patch = { weekday: Weekday.TUE, startMinute: 600, endMinute: 720 };
      const updated = { ...basePref, ...patch, updatedAt: new Date(now) };
      service.update.mockResolvedValue(updated);

      const result = await controller.update({ id: basePref.id }, patch);
      expect(service.update).toHaveBeenCalledWith(basePref.id, patch);
      expect(result).toEqual(updated);
    });

    it("should 400 when minutes out of range", async () => {
      const patch = { startMinute: -1 };
      await expect(
        controller.update({ id: basePref.id }, patch),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(service.update).not.toHaveBeenCalled();
    });

    it("should 400 when endMinute <= startMinute", async () => {
      const patch = { startMinute: 600, endMinute: 600 };
      await expect(
        controller.update({ id: basePref.id }, patch),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(service.update).not.toHaveBeenCalled();
    });
  });

  describe("remove", () => {
    it("should validate id and call service.remove", async () => {
      const deleted = { ...basePref };
      service.remove.mockResolvedValue(deleted);

      const result = await controller.remove({ id: basePref.id });
      expect(service.remove).toHaveBeenCalledWith(basePref.id);
      expect(result).toEqual(deleted);
    });
  });
});
