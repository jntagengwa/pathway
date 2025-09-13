import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { ChildrenController } from "../../children/children.controller";
import { ChildrenService } from "../../children/children.service";
import { CreateChildDto } from "../../children/dto/create-child.dto";
import { UpdateChildDto } from "../../children/dto/update-child.dto";

// Strongly-typed Jest mocks
const listMock: jest.Mock<Promise<unknown[]>, [tenantId?: string]> = jest.fn();
const getByIdMock: jest.Mock<Promise<unknown>, [id: string]> = jest.fn();
const createMock: jest.Mock<Promise<unknown>, [CreateChildDto]> = jest.fn();
const updateMock: jest.Mock<
  Promise<unknown>,
  [id: string, dto: UpdateChildDto]
> = jest.fn();

const mockService: ChildrenService = {
  list: listMock as unknown as ChildrenService["list"],
  getById: getByIdMock as unknown as ChildrenService["getById"],
  create: createMock as unknown as ChildrenService["create"],
  update: updateMock as unknown as ChildrenService["update"],
} as ChildrenService;

describe("ChildrenController", () => {
  let controller: ChildrenController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChildrenController],
      providers: [{ provide: ChildrenService, useValue: mockService }],
    }).compile();

    controller = module.get<ChildrenController>(ChildrenController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("list should return array", async () => {
    const row = { id: "c1", firstName: "Jess", lastName: "Doe" };
    listMock.mockResolvedValueOnce([row]);

    const res = await controller.list();
    expect(Array.isArray(res)).toBe(true);
    expect(res).toEqual([row]);
    expect(listMock).toHaveBeenCalledWith();
  });

  it("getById should return a child", async () => {
    const child = { id: "c1", firstName: "Jess", lastName: "Doe" };
    getByIdMock.mockResolvedValueOnce(child);

    const res = await controller.getById("c1");
    expect(res).toBe(child);
    expect(getByIdMock).toHaveBeenCalledWith("c1");
  });

  it("create should validate and call service", async () => {
    const dto: CreateChildDto = {
      firstName: "Jess",
      lastName: "Doe",
      allergies: "peanuts",
      tenantId: "11111111-1111-1111-1111-111111111111",
    };
    const created = { id: "c1", ...dto };
    createMock.mockResolvedValueOnce(created);

    const res = await controller.create(dto);
    expect(res).toEqual(created);
    expect(createMock).toHaveBeenCalledWith(dto);
  });

  it("create should 400 on invalid body (missing allergies)", async () => {
    const bad = {
      firstName: "Jess",
      lastName: "Doe",
      tenantId: "11111111-1111-1111-1111-111111111111",
    };

    await expect(controller.create(bad)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(createMock).not.toHaveBeenCalled();
  });

  it("update should validate and call service", async () => {
    const updated = { id: "c1", firstName: "New", lastName: "Name" };
    updateMock.mockResolvedValueOnce(updated);

    const res = await controller.update("c1", {
      firstName: "New",
      lastName: "Name",
    });
    expect(res).toEqual(updated);
    expect(updateMock).toHaveBeenCalledWith("c1", {
      firstName: "New",
      lastName: "Name",
    });
  });

  it("update should 400 on invalid uuid for groupId", async () => {
    await expect(
      controller.update("c1", { groupId: "not-a-uuid" }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(updateMock).not.toHaveBeenCalled();
  });
});
