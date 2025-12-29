import { Test } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { AttendanceController } from "../attendance.controller";
import { AttendanceService } from "../attendance.service";
import { PathwayAuthGuard } from "@pathway/auth";
// Strongly-typed Jest mocks
const listMock = jest.fn();
const getByIdMock = jest.fn();
const createMock = jest.fn();
const updateMock = jest.fn();
const mockService = {
    list: listMock,
    getById: getByIdMock,
    create: createMock,
    update: updateMock,
};
describe("AttendanceController", () => {
    let controller;
    const tenantId = "t-tenant";
    beforeEach(async () => {
        jest.clearAllMocks();
        const module = await Test.createTestingModule({
            controllers: [AttendanceController],
            providers: [{ provide: AttendanceService, useValue: mockService }],
        })
            .overrideGuard(PathwayAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();
        controller = module.get(AttendanceController);
    });
    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
    it("list should return array", async () => {
        const row = {
            id: "att-1",
            childId: "11111111-1111-1111-1111-111111111111",
            groupId: "22222222-2222-2222-2222-222222222222",
            sessionId: null,
            present: true,
            timestamp: new Date(),
        };
        listMock.mockResolvedValueOnce([row]);
        const res = await controller.list(tenantId);
        expect(Array.isArray(res)).toBe(true);
        expect(res).toEqual([row]);
        expect(listMock).toHaveBeenCalledWith(tenantId);
    });
    it("getById should return a record", async () => {
        const row = {
            id: "att-2",
            childId: "11111111-1111-1111-1111-111111111111",
            groupId: "22222222-2222-2222-2222-222222222222",
            sessionId: null,
            present: false,
            timestamp: new Date(),
        };
        getByIdMock.mockResolvedValueOnce(row);
        const res = await controller.getById("att-2", tenantId);
        expect(res).toBe(row);
        expect(getByIdMock).toHaveBeenCalledWith("att-2", tenantId);
    });
    it("create should validate and call service", async () => {
        const dto = {
            childId: "11111111-1111-1111-1111-111111111111",
            groupId: "22222222-2222-2222-2222-222222222222",
            present: true,
        };
        const created = {
            id: "att-3",
            childId: dto.childId,
            groupId: dto.groupId,
            sessionId: null,
            present: true,
            timestamp: new Date(),
        };
        createMock.mockResolvedValueOnce(created);
        const res = await controller.create(dto, tenantId);
        expect(res).toEqual(created);
        expect(createMock).toHaveBeenCalledWith(dto, tenantId);
    });
    it("create should 400 on invalid body (missing present)", async () => {
        const bad = {
            childId: "11111111-1111-1111-1111-111111111111",
            groupId: "22222222-2222-2222-2222-222222222222",
        }; // intentionally invalid
        await expect(controller.create(bad, tenantId)).rejects.toBeInstanceOf(BadRequestException);
        expect(createMock).not.toHaveBeenCalled();
    });
    it("update should validate and call service", async () => {
        const updated = {
            id: "att-4",
            childId: "11111111-1111-1111-1111-111111111111",
            groupId: "22222222-2222-2222-2222-222222222222",
            sessionId: null,
            present: false,
            timestamp: new Date(),
        };
        updateMock.mockResolvedValueOnce(updated);
        const res = await controller.update("att-4", { present: false }, tenantId);
        expect(res).toEqual(updated);
        expect(updateMock).toHaveBeenCalledWith("att-4", { present: false }, tenantId);
    });
    it("update should 400 on invalid uuid in groupId", async () => {
        await expect(
        // invalid uuid
        controller.update("att-5", {
            groupId: "not-a-uuid",
        }, tenantId)).rejects.toBeInstanceOf(BadRequestException);
        expect(updateMock).not.toHaveBeenCalled();
    });
});
