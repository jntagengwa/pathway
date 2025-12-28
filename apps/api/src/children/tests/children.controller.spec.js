import { Test } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { PathwayAuthGuard } from "@pathway/auth";
import { ChildrenController } from "../../children/children.controller";
import { ChildrenService } from "../../children/children.service";
const tenantId = "t1";
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
describe("ChildrenController", () => {
    let controller;
    beforeEach(async () => {
        jest.clearAllMocks();
        const module = await Test.createTestingModule({
            controllers: [ChildrenController],
            providers: [{ provide: ChildrenService, useValue: mockService }],
        })
            .overrideGuard(PathwayAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();
        controller = module.get(ChildrenController);
    });
    it("list should return array", async () => {
        const row = { id: "c1", firstName: "Jess", lastName: "Doe" };
        listMock.mockResolvedValueOnce([row]);
        const res = await controller.list(tenantId);
        expect(Array.isArray(res)).toBe(true);
        expect(res).toEqual([row]);
        expect(listMock).toHaveBeenCalledWith(tenantId);
    });
    it("getById should return a child", async () => {
        const child = { id: "c1", firstName: "Jess", lastName: "Doe" };
        getByIdMock.mockResolvedValueOnce(child);
        const res = await controller.getById("c1", tenantId);
        expect(res).toBe(child);
        expect(getByIdMock).toHaveBeenCalledWith("c1", tenantId);
    });
    it("create should validate and call service", async () => {
        const dto = {
            firstName: "Jess",
            lastName: "Doe",
            allergies: "peanuts",
        };
        const created = { id: "c1", ...dto };
        createMock.mockResolvedValueOnce(created);
        const res = await controller.create(dto, tenantId);
        expect(res).toEqual(created);
        expect(createMock).toHaveBeenCalledWith(dto, tenantId);
    });
    it("create should 400 on invalid body (missing allergies)", async () => {
        const bad = {
            firstName: "Jess",
            lastName: "Doe",
        };
        await expect(controller.create(bad, tenantId)).rejects.toBeInstanceOf(BadRequestException);
        expect(createMock).not.toHaveBeenCalled();
    });
    it("update should validate and call service", async () => {
        const updated = { id: "c1", firstName: "New", lastName: "Name" };
        updateMock.mockResolvedValueOnce(updated);
        const res = await controller.update("c1", {
            firstName: "New",
            lastName: "Name",
        }, tenantId);
        expect(res).toEqual(updated);
        expect(updateMock).toHaveBeenCalledWith("c1", {
            firstName: "New",
            lastName: "Name",
        }, tenantId);
    });
    it("update should 400 on invalid uuid for groupId", async () => {
        await expect(controller.update("c1", { groupId: "not-a-uuid" }, tenantId)).rejects.toBeInstanceOf(BadRequestException);
        expect(updateMock).not.toHaveBeenCalled();
    });
});
