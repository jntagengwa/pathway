import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { PathwayAuthGuard } from "@pathway/auth";
import { AuthUserGuard } from "../../auth/auth-user.guard";
import { ChildrenController } from "../../children/children.controller";
import { ChildrenService } from "../../children/children.service";
import { CreateChildDto } from "../../children/dto/create-child.dto";
import { UpdateChildDto } from "../../children/dto/update-child.dto";

const tenantId = "t1";

const listMock: jest.Mock<Promise<unknown[]>, [string]> = jest.fn();
const getByIdMock: jest.Mock<Promise<unknown>, [string, string]> = jest.fn();
const createMock: jest.Mock<
  Promise<unknown>,
  [CreateChildDto, string]
> = jest.fn();
const updateMock: jest.Mock<
  Promise<unknown>,
  [string, UpdateChildDto, string]
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
    })
      .overrideGuard(PathwayAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthUserGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChildrenController>(ChildrenController);
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
    const dto: CreateChildDto = {
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
    } as unknown as CreateChildDto;

    await expect(controller.create(bad, tenantId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(createMock).not.toHaveBeenCalled();
  });

  it("update should validate and call service", async () => {
    const updated = { id: "c1", firstName: "New", lastName: "Name" };
    updateMock.mockResolvedValueOnce(updated);

    const res = await controller.update(
      "c1",
      {
        firstName: "New",
        lastName: "Name",
      },
      tenantId,
    );
    expect(res).toEqual(updated);
    expect(updateMock).toHaveBeenCalledWith(
      "c1",
      {
        firstName: "New",
        lastName: "Name",
      },
      tenantId,
    );
  });

  it("update should 400 on invalid uuid for groupId", async () => {
    await expect(
      controller.update("c1", { groupId: "not-a-uuid" }, tenantId),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(updateMock).not.toHaveBeenCalled();
  });
});
