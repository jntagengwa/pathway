import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { AttendanceController } from "../attendance.controller";
import { AttendanceService } from "../attendance.service";
import { CreateAttendanceDto } from "../dto/create-attendance.dto";
import { UpdateAttendanceDto } from "../dto/update-attendance.dto";

// Shared row type for clear expectations
interface AttendanceRow {
  id: string;
  childId: string;
  groupId: string;
  sessionId: string | null;
  present: boolean;
  timestamp: Date;
}

// Strongly-typed Jest mocks
const listMock: jest.Mock<Promise<AttendanceRow[]>, []> = jest.fn();
const getByIdMock: jest.Mock<Promise<AttendanceRow>, [string]> = jest.fn();
const createMock: jest.Mock<
  Promise<AttendanceRow>,
  [CreateAttendanceDto]
> = jest.fn();
const updateMock: jest.Mock<
  Promise<AttendanceRow>,
  [string, UpdateAttendanceDto]
> = jest.fn();

const mockService: AttendanceService = {
  list: listMock as unknown as AttendanceService["list"],
  getById: getByIdMock as unknown as AttendanceService["getById"],
  create: createMock as unknown as AttendanceService["create"],
  update: updateMock as unknown as AttendanceService["update"],
} as AttendanceService;

describe("AttendanceController", () => {
  let controller: AttendanceController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [{ provide: AttendanceService, useValue: mockService }],
    }).compile();

    controller = module.get<AttendanceController>(AttendanceController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("list should return array", async () => {
    const row: AttendanceRow = {
      id: "att-1",
      childId: "11111111-1111-1111-1111-111111111111",
      groupId: "22222222-2222-2222-2222-222222222222",
      sessionId: null,
      present: true,
      timestamp: new Date(),
    };
    listMock.mockResolvedValueOnce([row]);

    const res = await controller.list();
    expect(Array.isArray(res)).toBe(true);
    expect(res).toEqual([row]);
    expect(listMock).toHaveBeenCalledWith();
  });

  it("getById should return a record", async () => {
    const row: AttendanceRow = {
      id: "att-2",
      childId: "11111111-1111-1111-1111-111111111111",
      groupId: "22222222-2222-2222-2222-222222222222",
      sessionId: null,
      present: false,
      timestamp: new Date(),
    };
    getByIdMock.mockResolvedValueOnce(row);

    const res = await controller.getById("att-2");
    expect(res).toBe(row);
    expect(getByIdMock).toHaveBeenCalledWith("att-2");
  });

  it("create should validate and call service", async () => {
    const dto: CreateAttendanceDto = {
      childId: "11111111-1111-1111-1111-111111111111",
      groupId: "22222222-2222-2222-2222-222222222222",
      present: true,
    };
    const created: AttendanceRow = {
      id: "att-3",
      childId: dto.childId,
      groupId: dto.groupId,
      sessionId: null,
      present: true,
      timestamp: new Date(),
    };
    createMock.mockResolvedValueOnce(created);

    const res = await controller.create(dto);
    expect(res).toEqual(created);
    expect(createMock).toHaveBeenCalledWith(dto);
  });

  it("create should 400 on invalid body (missing present)", async () => {
    const bad = {
      childId: "11111111-1111-1111-1111-111111111111",
      groupId: "22222222-2222-2222-2222-222222222222",
    } as unknown as CreateAttendanceDto; // intentionally invalid

    await expect(controller.create(bad)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(createMock).not.toHaveBeenCalled();
  });

  it("update should validate and call service", async () => {
    const updated: AttendanceRow = {
      id: "att-4",
      childId: "11111111-1111-1111-1111-111111111111",
      groupId: "22222222-2222-2222-2222-222222222222",
      sessionId: null,
      present: false,
      timestamp: new Date(),
    };
    updateMock.mockResolvedValueOnce(updated);

    const res = await controller.update("att-4", { present: false });
    expect(res).toEqual(updated);
    expect(updateMock).toHaveBeenCalledWith("att-4", { present: false });
  });

  it("update should 400 on invalid uuid in groupId", async () => {
    await expect(
      // invalid uuid
      controller.update("att-5", {
        groupId: "not-a-uuid" as unknown as string,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(updateMock).not.toHaveBeenCalled();
  });
});
