import { Test, TestingModule } from "@nestjs/testing";
import { OrgsController } from "../orgs.controller";
import { OrgsService } from "../orgs.service";
import { PathwayAuthGuard } from "@pathway/auth";
import { AuthUserGuard } from "../../auth/auth-user.guard";

// Helper type: the resolved return type of OrgsService.register
type RegisterReturn = Awaited<ReturnType<OrgsService["register"]>>;

describe("OrgsController", () => {
  let controller: OrgsController;

  // Create a strictly-typed mock for OrgsService.register using the real signature
  const registerMock = jest.fn() as jest.MockedFunction<
    OrgsService["register"]
  >;
  const mockOrgsService: Pick<OrgsService, "register"> = {
    register: registerMock,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrgsController],
      providers: [{ provide: OrgsService, useValue: mockOrgsService }],
    })
      .overrideGuard(PathwayAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AuthUserGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<OrgsController>(OrgsController);
    registerMock.mockReset();
  });

  it("should delegate to OrgsService.register and return the created org", async () => {
    // Infer the controller method parameter type to avoid `any`
    type ControllerRegisterParam = Parameters<OrgsController["register"]>[0];

    const payload: ControllerRegisterParam = {
      org: {
        name: "Acme Church",
        slug: "acme-church",
        planCode: "STARTER",
        isSuite: true,
      },
      initialTenant: { create: false },
      admin: { email: "admin@acme.test", fullName: "Admin User" },
    } as ControllerRegisterParam;

    const result: RegisterReturn = {
      org: {
        id: "11111111-2222-3333-4444-555555555555",
        name: "Acme Church",
        slug: "acme-church",
        planCode: "STARTER",
      },
    } as RegisterReturn;

    // Configure mock and execute
    registerMock.mockResolvedValue(result);
    const res = await controller.register(payload);

    expect(registerMock).toHaveBeenCalledTimes(1);
    expect(registerMock).toHaveBeenCalledWith(
      expect.objectContaining({
        org: expect.objectContaining({
          name: "Acme Church",
          slug: "acme-church",
          // `planCode` is transformed by the DTO (e.g., to "trial"), so we don't assert its exact value here.
          isSuite: true,
        }),
        initialTenant: expect.objectContaining({ create: false }),
        admin: expect.objectContaining({
          email: "admin@acme.test",
          fullName: "Admin User",
        }),
      }),
    );
    expect(res).toEqual(result);
  });

  it("should surface errors thrown by the service", async () => {
    type ControllerRegisterParam = Parameters<OrgsController["register"]>[0];
    const payload: ControllerRegisterParam = {
      org: {
        name: "Bad Org",
        slug: "bad-org",
        planCode: "STARTER",
        isSuite: true,
      },
      initialTenant: { create: false },
      admin: { email: "admin@acme.test", fullName: "Admin User" },
    } as ControllerRegisterParam;

    const err = new Error("failed to register");
    registerMock.mockRejectedValue(err);

    await expect(controller.register(payload)).rejects.toThrow(
      "failed to register",
    );
    expect(registerMock).toHaveBeenCalledTimes(1);
  });
});
