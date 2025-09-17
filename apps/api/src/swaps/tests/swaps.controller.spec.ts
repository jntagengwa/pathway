import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { SwapsController } from "../..//swaps/swaps.controller";
import { SwapsService } from "../..//swaps/swaps.service";
import { CreateSwapDto, UpdateSwapDto } from "../..//swaps/dto";
import { SwapStatus } from "@pathway/db";

type SwapRecord = {
  id: string;
  assignmentId: string;
  fromUserId: string;
  toUserId: string | null;
  status: SwapStatus;
  createdAt: Date;
  updatedAt: Date;
};

describe("SwapsController", () => {
  let controller: SwapsController;

  const now = new Date();

  const base: SwapRecord = {
    id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
    assignmentId: "11111111-1111-4111-9111-111111111111",
    fromUserId: "22222222-2222-4222-9222-222222222222",
    toUserId: "33333333-3333-4333-9333-333333333333",
    status: SwapStatus.REQUESTED,
    createdAt: now,
    updatedAt: now,
  };

  const createDto: CreateSwapDto = {
    assignmentId: base.assignmentId,
    fromUserId: base.fromUserId,
    toUserId: base.toUserId!,
  };

  const updateDtoAccept: UpdateSwapDto = {
    status: SwapStatus.ACCEPTED,
    toUserId: base.toUserId!,
  };

  const updateDtoDecline: UpdateSwapDto = {
    status: SwapStatus.DECLINED,
  };

  const serviceMock: Record<keyof SwapsService, unknown> = {
    create: jest.fn(
      async (dto: CreateSwapDto): Promise<SwapRecord> => ({
        ...base,
        id: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
        assignmentId: dto.assignmentId,
        fromUserId: dto.fromUserId,
        toUserId: dto.toUserId ?? null,
        status: SwapStatus.REQUESTED,
      }),
    ),
    findOne: jest.fn(
      async (id: string): Promise<SwapRecord | null> => ({
        ...base,
        id,
      }),
    ),
    findAll: jest
      .fn(async (): Promise<SwapRecord[]> => [base])
      // allow calling with or without a query object
      .mockImplementation(async () => [base]),
    update: jest.fn(
      async (id: string, dto: UpdateSwapDto): Promise<SwapRecord> => ({
        ...base,
        id,
        status: dto.status ?? base.status,
        toUserId: dto.toUserId ?? base.toUserId,
        updatedAt: new Date(),
      }),
    ),
    remove: jest.fn(
      async (id: string): Promise<SwapRecord> => ({
        ...base,
        id,
      }),
    ),
  } as unknown as SwapsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SwapsController],
      providers: [{ provide: SwapsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<SwapsController>(SwapsController);

    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should call service.create and return the created swap", async () => {
      const result = await controller.create(createDto);
      expect(serviceMock.create as jest.Mock).toHaveBeenCalledWith(createDto);
      expect(result).toMatchObject({
        assignmentId: createDto.assignmentId,
        fromUserId: createDto.fromUserId,
        status: SwapStatus.REQUESTED,
      });
    });

    it("should 400 on invalid UUIDs", async () => {
      await expect(
        controller.create({
          ...createDto,
          assignmentId: "not-a-uuid",
        } as unknown as CreateSwapDto),
      ).rejects.toBeInstanceOf(BadRequestException);

      await expect(
        controller.create({
          ...createDto,
          fromUserId: "also-bad",
        } as unknown as CreateSwapDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("should 400 when end-user validation fails in DTO parsing (e.g. empty body)", async () => {
      await expect(
        controller.create({} as unknown as CreateSwapDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("findOne", () => {
    it("should validate id and return a swap", async () => {
      const res = await controller.findOne(base.id);
      expect(serviceMock.findOne as jest.Mock).toHaveBeenCalledWith(base.id);
      expect(res).toMatchObject({ id: base.id });
    });

    it("should 400 on invalid id", async () => {
      await expect(controller.findOne("bad-id")).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe("findAll", () => {
    it("should call service.findAll with optional filters", async () => {
      const res = await controller.findAll({});
      expect(serviceMock.findAll as jest.Mock).toHaveBeenCalledTimes(1);
      expect(Array.isArray(res)).toBe(true);
    });
  });

  describe("update", () => {
    it("should accept a swap when toUserId is supplied", async () => {
      const updated = await controller.update(base.id, updateDtoAccept);
      expect(serviceMock.update as jest.Mock).toHaveBeenCalledWith(
        base.id,
        updateDtoAccept,
      );
      expect(updated.status).toBe(SwapStatus.ACCEPTED);
    });

    it("should 400 if accepting without toUserId", async () => {
      await expect(
        controller.update(base.id, { status: SwapStatus.ACCEPTED }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("should decline a swap", async () => {
      const updated = await controller.update(base.id, updateDtoDecline);
      expect(serviceMock.update as jest.Mock).toHaveBeenCalledWith(
        base.id,
        updateDtoDecline,
      );
      expect(updated.status).toBe(SwapStatus.DECLINED);
    });

    it("should 400 on invalid id", async () => {
      await expect(
        controller.update("nope", updateDtoDecline),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("should 400 on invalid DTO", async () => {
      await expect(
        controller.update(base.id, {
          status: "NOT_A_STATUS",
        } as unknown as UpdateSwapDto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("remove", () => {
    it("should validate id and call service.remove", async () => {
      const removed = await controller.remove(base.id);
      expect(serviceMock.remove as jest.Mock).toHaveBeenCalledWith(base.id);
      expect(removed).toMatchObject({ id: base.id });
    });

    it("should 400 on invalid id", async () => {
      await expect(controller.remove("bad")).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
