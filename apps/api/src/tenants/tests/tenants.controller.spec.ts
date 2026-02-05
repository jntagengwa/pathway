import { CreateTenantDto } from "../dto/create-tenant.dto";
import { BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { TenantsController } from "../tenants.controller";
import { TenantsService } from "../tenants.service";
import { AuthUserGuard } from "../../auth/auth-user.guard";

jest.mock("@pathway/db", () => ({
  prisma: {
    tenant: { findUnique: jest.fn().mockResolvedValue({ id: "t1", orgId: "org-1" }) },
    siteMembership: { findFirst: jest.fn().mockResolvedValue({ role: "SITE_ADMIN" }) },
    orgMembership: { findFirst: jest.fn().mockResolvedValue(null) },
    userOrgRole: { findFirst: jest.fn().mockResolvedValue(null) },
  },
  OrgRole: { ORG_ADMIN: "ORG_ADMIN" },
  SiteRole: { SITE_ADMIN: "SITE_ADMIN" },
}));

const ORG_ID = "11111111-1111-1111-1111-111111111111";

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
    updateProfile: jest.fn().mockResolvedValue({
      id: "1",
      name: "Updated Site",
      slug: "test-tenant",
      timezone: "Europe/London",
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (mockService.updateProfile as jest.Mock).mockResolvedValue({
      id: "1",
      name: "Updated Site",
      slug: "test-tenant",
      timezone: "Europe/London",
    });
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [{ provide: TenantsService, useValue: mockService }],
    })
      .overrideGuard(AuthUserGuard)
      .useValue({ canActivate: () => true })
      .compile();

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
    const dto = { name: "Test Tenant", slug: "test-tenant", orgId: ORG_ID };
    await expect(controller.create(dto)).resolves.toEqual(mockTenant);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it("create should accept optional relation arrays and pass them to service", async () => {
    const dto = {
      name: "Tenant With Links",
      slug: "tenant-links",
      orgId: ORG_ID,
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

  describe("updateProfile", () => {
    const req = { authUserId: "user-1" } as Parameters<
      TenantsController["updateProfile"]
    >[1];

    it("should 200 and return updated tenant when name and timezone provided", async () => {
      const result = await controller.updateProfile("t1", req, {
        name: "Updated Site",
        timezone: "Europe/London",
      });
      expect(service.updateProfile).toHaveBeenCalledWith("t1", "user-1", {
        name: "Updated Site",
        timezone: "Europe/London",
      });
      expect(result.timezone).toBe("Europe/London");
      expect(result.name).toBe("Updated Site");
    });

    it("should 400 for invalid timezone", async () => {
      await expect(
        controller.updateProfile("t1", req, {
          name: "OK Name",
          timezone: "Invalid/Timezone",
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(service.updateProfile).not.toHaveBeenCalled();
    });

    it("should 400 when neither name nor timezone provided", async () => {
      await expect(
        controller.updateProfile("t1", req, {}),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(service.updateProfile).not.toHaveBeenCalled();
    });
  });
});
