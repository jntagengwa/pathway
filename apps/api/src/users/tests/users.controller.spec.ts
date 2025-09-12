import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { UsersController } from "../users.controller";
import { UsersService } from "../users.service";

describe("UsersController", () => {
  let controller: UsersController;
  let service: UsersService;

  const now = new Date();
  const user = {
    id: "u1",
    email: "alice@example.com",
    name: "Alice",
    createdAt: now,
  };

  const mockService = {
    list: jest.fn().mockResolvedValue([user]),
    getById: jest.fn().mockResolvedValue(user),
    create: jest.fn().mockResolvedValue(user),
  } as const;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);

    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("list should return array", async () => {
    await expect(controller.list()).resolves.toEqual([user]);
    expect(service.list).toHaveBeenCalled();
  });

  it("getById should return a user when found", async () => {
    (service.getById as jest.Mock).mockResolvedValueOnce(user);
    await expect(controller.getById("u1")).resolves.toEqual(user);
    expect(service.getById).toHaveBeenCalledWith("u1");
  });

  it("getById should throw NotFound when missing", async () => {
    (service.getById as jest.Mock).mockResolvedValueOnce(null);
    await expect(controller.getById("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("create should call service and return user", async () => {
    const dto = { email: "alice@example.com", name: "Alice", tenantId: "t1" };
    await expect(controller.create(dto)).resolves.toEqual(user);
    expect(service.create).toHaveBeenCalledWith(dto);
  });
});
