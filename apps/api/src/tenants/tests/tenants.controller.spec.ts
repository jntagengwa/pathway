import { CreateTenantDto } from "../dto/create-tenant.dto";
import { BadRequestException } from "@nestjs/common";
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
    jest.clearAllMocks();
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

  it("create should accept optional relation arrays and pass them to service", async () => {
    const dto = {
      name: "Tenant With Links",
      slug: "tenant-links",
      users: ["11111111-1111-1111-1111-111111111111"],
      groups: ["22222222-2222-2222-2222-222222222222"],
      children: ["33333333-3333-3333-3333-333333333333"],
      roles: ["44444444-4444-4444-4444-444444444444"],
    };

    await expect(controller.create(dto as CreateTenantDto)).resolves.toEqual(
      mockTenant,
    );
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it("create should 400 on invalid slug (fails DTO validation)", async () => {
    const bad = { name: "Bad", slug: "Bad Slug" };

    await expect(
      controller.create(bad as CreateTenantDto),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(service.create).not.toHaveBeenCalled();
  });
});
