/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { PathwayAuthGuard } from "@pathway/auth";
import { SwapsController } from "../..//swaps/swaps.controller";
import { SwapsService } from "../..//swaps/swaps.service";
import { SwapStatus } from "@pathway/db";
describe("SwapsController", () => {
    let controller;
    const tenantId = "t1";
    const now = new Date();
    const base = {
        id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
        assignmentId: "11111111-1111-4111-9111-111111111111",
        fromUserId: "22222222-2222-4222-9222-222222222222",
        toUserId: "33333333-3333-4333-9333-333333333333",
        status: SwapStatus.REQUESTED,
        createdAt: now,
        updatedAt: now,
    };
    const createDto = {
        assignmentId: base.assignmentId,
        fromUserId: base.fromUserId,
        toUserId: base.toUserId,
    };
    const updateDtoAccept = {
        status: SwapStatus.ACCEPTED,
        toUserId: base.toUserId,
    };
    const updateDtoDecline = {
        status: SwapStatus.DECLINED,
    };
    const serviceMock = {
        create: jest.fn(async (dto, _t) => ({
            ...base,
            id: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
            assignmentId: dto.assignmentId,
            fromUserId: dto.fromUserId,
            toUserId: dto.toUserId ?? null,
            status: SwapStatus.REQUESTED,
        })),
        findOne: jest.fn(async (id, _t) => ({
            ...base,
            id,
        })),
        findAll: jest
            .fn(async (_filters) => [base])
            .mockImplementation(async () => [base]),
        update: jest.fn(async (id, dto, _t) => {
            if (dto.status === SwapStatus.ACCEPTED && !dto.toUserId) {
                throw new BadRequestException("toUserId is required when status is ACCEPTED");
            }
            return {
                ...base,
                id,
                status: dto.status ?? base.status,
                toUserId: dto.toUserId ?? base.toUserId,
                updatedAt: new Date(),
            };
        }),
        remove: jest.fn(async (_id, _t) => ({
            count: 1,
        })),
    };
    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [SwapsController],
            providers: [{ provide: SwapsService, useValue: serviceMock }],
        })
            .overrideGuard(PathwayAuthGuard)
            .useValue({ canActivate: () => true })
            .compile();
        controller = module.get(SwapsController);
        jest.clearAllMocks();
    });
    describe("create", () => {
        it("should call service.create and return the created swap", async () => {
            const result = await controller.create(createDto, tenantId);
            expect(serviceMock.create).toHaveBeenCalledWith(createDto, tenantId);
            expect(result).toMatchObject({
                assignmentId: createDto.assignmentId,
                fromUserId: createDto.fromUserId,
                status: SwapStatus.REQUESTED,
            });
        });
        it("should 400 on invalid UUIDs", async () => {
            await expect(controller.create({
                ...createDto,
                assignmentId: "not-a-uuid",
            }, tenantId)).rejects.toBeInstanceOf(BadRequestException);
            await expect(controller.create({
                ...createDto,
                fromUserId: "also-bad",
            }, tenantId)).rejects.toBeInstanceOf(BadRequestException);
        });
        it("should 400 when end-user validation fails in DTO parsing (e.g. empty body)", async () => {
            await expect(controller.create({}, tenantId)).rejects.toBeInstanceOf(BadRequestException);
        });
    });
    describe("findOne", () => {
        it("should validate id and return a swap", async () => {
            const res = await controller.findOne(base.id, tenantId);
            expect(serviceMock.findOne).toHaveBeenCalledWith(base.id, tenantId);
            expect(res).toMatchObject({ id: base.id });
        });
        it("should 400 on invalid id", async () => {
            await expect(controller.findOne("bad-id", tenantId)).rejects.toBeInstanceOf(BadRequestException);
        });
    });
    describe("findAll", () => {
        it("should call service.findAll with optional filters", async () => {
            const res = await controller.findAll({}, tenantId);
            expect(serviceMock.findAll).toHaveBeenCalledTimes(1);
            expect(Array.isArray(res)).toBe(true);
        });
    });
    describe("update", () => {
        it("should accept a swap when toUserId is supplied", async () => {
            const updated = await controller.update(base.id, updateDtoAccept, tenantId);
            expect(serviceMock.update).toHaveBeenCalledWith(base.id, updateDtoAccept, tenantId);
            expect(updated.status).toBe(SwapStatus.ACCEPTED);
        });
        it("should 400 when status ACCEPTED and toUserId missing", async () => {
            await expect(controller.update(base.id, { status: SwapStatus.ACCEPTED }, tenantId)).rejects.toBeInstanceOf(BadRequestException);
        });
        it("should call service.update for decline", async () => {
            const updated = await controller.update(base.id, updateDtoDecline, tenantId);
            expect(serviceMock.update).toHaveBeenCalledWith(base.id, updateDtoDecline, tenantId);
            expect(updated.status).toBe(SwapStatus.DECLINED);
        });
        it("should 400 on invalid id", async () => {
            await expect(controller.update("nope", updateDtoDecline, tenantId)).rejects.toBeInstanceOf(BadRequestException);
        });
    });
    describe("remove", () => {
        it("should call service.remove", async () => {
            const removed = await controller.remove(base.id, tenantId);
            expect(serviceMock.remove).toHaveBeenCalledWith(base.id, tenantId);
            expect(removed).toEqual({ count: 1 });
        });
        it("should 400 on invalid id", async () => {
            await expect(controller.remove("bad", tenantId)).rejects.toBeInstanceOf(BadRequestException);
        });
    });
});
