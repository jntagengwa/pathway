import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { SessionsController } from "../sessions.controller";
import { SessionsService } from "../sessions.service";
import { CreateSessionDto } from "../dto/create-session.dto";
import { UpdateSessionDto } from "../dto/update-session.dto";
import { PathwayAuthGuard } from "@pathway/auth";
import { EntitlementsEnforcementService } from "../../billing/entitlements-enforcement.service";

// Minimal shape used in tests (avoid importing Prisma types here)
interface SessionShape {
  id: string;
  tenantId: string;
  groupId: string | null;
  startsAt: Date;
  endsAt: Date;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}

describe("SessionsController", () => {
  let controller: SessionsController;

  const tenantId = "t1";
  const orgId = "org-123";
  const baseSession: SessionShape = {
    id: "sess-1",
    tenantId,
    groupId: "g1",
    startsAt: new Date("2025-01-01T09:00:00Z"),
    endsAt: new Date("2025-01-01T10:00:00Z"),
    title: "Kids service",
    createdAt: new Date("2024-12-31T00:00:00Z"),
    updatedAt: new Date("2024-12-31T00:00:00Z"),
  };

  // Strictly typed mock to avoid `any`
  const serviceMock: jest.Mocked<
    Pick<SessionsService, "list" | "getById" | "create" | "update">
  > = {
    list: jest.fn<
      Promise<SessionShape[]>,
      [{ tenantId: string; groupId?: string }]
    >(),
    getById: jest.fn<Promise<SessionShape>, [string, string]>(),
    create: jest.fn<Promise<SessionShape>, [CreateSessionDto, string]>(),
    update: jest.fn<
      Promise<SessionShape>,
      [string, UpdateSessionDto, string]
    >(),
  };

  const enforcementMock: jest.Mocked<
    Pick<
      EntitlementsEnforcementService,
      "checkAv30ForOrg" | "assertWithinHardCap"
    >
  > = {
    checkAv30ForOrg: jest.fn().mockResolvedValue({
      orgId,
      currentAv30: 10,
      av30Cap: 100,
      status: "OK",
      graceUntil: null,
      messageCode: "av30.ok",
    }),
    assertWithinHardCap: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [
        { provide: SessionsService, useValue: serviceMock },
        {
          provide: EntitlementsEnforcementService,
          useValue: enforcementMock,
        },
      ],
    })
      .overrideGuard(PathwayAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SessionsController>(SessionsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("list should return array", async () => {
    serviceMock.list.mockResolvedValueOnce([baseSession]);
    const res = await controller.list({} as { groupId?: string }, tenantId);
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].id).toBe(baseSession.id);
    expect(serviceMock.list).toHaveBeenCalledWith({
      tenantId,
      groupId: undefined,
    });
  });

  it("byId should return a session", async () => {
    serviceMock.getById.mockResolvedValueOnce(baseSession);
    const res = await controller.getById(baseSession.id, tenantId);
    expect(res).toMatchObject({ id: baseSession.id });
    expect(serviceMock.getById).toHaveBeenCalledWith(baseSession.id, tenantId);
  });

  it("create should call service and return session", async () => {
    const dto: CreateSessionDto = {
      tenantId,
      groupId: "g1",
      startsAt: new Date("2025-01-01T09:00:00Z"),
      endsAt: new Date("2025-01-01T10:00:00Z"),
      title: "Kids service",
    };
    serviceMock.create.mockResolvedValueOnce(baseSession);
    const res = await controller.create(dto, tenantId, orgId);
    expect(res).toEqual(baseSession);
    expect(serviceMock.create).toHaveBeenCalledWith(dto, tenantId);
  });

  it("create should 400 when endsAt <= startsAt (DTO validation)", async () => {
    const bad: CreateSessionDto = {
      tenantId,
      groupId: "g1",
      startsAt: new Date("2025-01-01T10:00:00Z"),
      endsAt: new Date("2025-01-01T09:00:00Z"),
      title: "Bad times",
    };

    await expect(controller.create(bad, tenantId, orgId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(serviceMock.create).not.toHaveBeenCalled();
  });

  it("create should block when hard cap enforcement throws", async () => {
    enforcementMock.assertWithinHardCap.mockImplementation(() => {
      throw new Error("HARD_CAP");
    });

    const dto: CreateSessionDto = {
      tenantId,
      groupId: "g1",
      startsAt: new Date("2025-01-01T09:00:00Z"),
      endsAt: new Date("2025-01-01T10:00:00Z"),
      title: "Kids service",
    };

    await expect(controller.create(dto, tenantId, orgId)).rejects.toThrow(
      "HARD_CAP",
    );
    expect(serviceMock.create).not.toHaveBeenCalled();
  });

  it("update should call service and return session", async () => {
    const dto: UpdateSessionDto = {
      title: "Updated",
      startsAt: undefined,
      endsAt: undefined,
      groupId: undefined,
    };
    const updated: SessionShape = { ...baseSession, title: "Updated" };
    serviceMock.update.mockResolvedValueOnce(updated);

    const res = await controller.update(baseSession.id, dto, tenantId);
    expect(res).toEqual(updated);
    expect(serviceMock.update).toHaveBeenCalledWith(
      baseSession.id,
      dto,
      tenantId,
    );
  });

  it("update should 400 when endsAt <= startsAt (DTO validation)", async () => {
    const bad: UpdateSessionDto = {
      startsAt: new Date("2025-01-01T11:00:00Z"),
      endsAt: new Date("2025-01-01T10:00:00Z"),
    };
    await expect(
      controller.update("sess-1", bad, tenantId),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(serviceMock.update).not.toHaveBeenCalled();
  });
});
