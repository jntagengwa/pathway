import { Test, TestingModule } from "@nestjs/testing";
import { TenantsController } from "../tenants.controller";
import { TenantsService } from "../tenants.service";

describe("TenantsController", () => {
  let controller: TenantsController;
  let service: TenantsService;

  const mockTenant = {
    id: "1",
    name: "Test Tenant",
    slug: "test-tenant",
    createdAt: new Date(),
  };

  const mockService = {
    list: jest.fn().mockResolvedValue([mockTenant]),
    getBySlug: jest.fn().mockResolvedValue(mockTenant),
    create: jest.fn().mockResolvedValue(mockTenant),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [{ provide: TenantsService, useValue: mockService }],
    }).compile();

    controller = module.get<TenantsController>(TenantsController);
    service = module.get<TenantsService>(TenantsService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("list should return array", async () => {
    await expect(controller.list()).resolves.toEqual([mockTenant]);
    expect(service.list).toHaveBeenCalled();
  });

  it("bySlug should return a tenant", async () => {
    await expect(controller.bySlug("test-tenant")).resolves.toEqual(mockTenant);
    expect(service.getBySlug).toHaveBeenCalledWith("test-tenant");
  });

  it("create should call service and return tenant", async () => {
    const dto = { name: "Test Tenant", slug: "test-tenant" };
    await expect(controller.create(dto)).resolves.toEqual(mockTenant);
    expect(service.create).toHaveBeenCalledWith(dto);
  });
});
