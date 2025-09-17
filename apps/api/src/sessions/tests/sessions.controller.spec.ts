import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { SessionsController } from "../sessions.controller";
import { SessionsService } from "../sessions.service";
import { CreateSessionDto } from "../dto/create-session.dto";
import { UpdateSessionDto } from "../dto/update-session.dto";

// Filters shape to match service/controller signature
interface SessionListFilters {
  tenantId?: string;
  groupId?: string;
}

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

  const baseSession: SessionShape = {
    id: "sess-1",
    tenantId: "t1",
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
    list: jest.fn<Promise<SessionShape[]>, [SessionListFilters?]>(),
    getById: jest.fn<Promise<SessionShape>, [string]>(),
    create: jest.fn<Promise<SessionShape>, [CreateSessionDto]>(),
    update: jest.fn<Promise<SessionShape>, [string, UpdateSessionDto]>(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [{ provide: SessionsService, useValue: serviceMock }],
    }).compile();

    controller = module.get<SessionsController>(SessionsController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("list should return array", async () => {
    serviceMock.list.mockResolvedValueOnce([baseSession]);
    const res = await controller.list({} as SessionListFilters);
    expect(Array.isArray(res)).toBe(true);
    expect(res[0].id).toBe(baseSession.id);
    expect(serviceMock.list).toHaveBeenCalledWith({});
  });

  it("byId should return a session", async () => {
    serviceMock.getById.mockResolvedValueOnce(baseSession);
    const res = await controller.getById(baseSession.id);
    expect(res).toMatchObject({ id: baseSession.id });
    expect(serviceMock.getById).toHaveBeenCalledWith(baseSession.id);
  });

  it("create should call service and return session", async () => {
    const dto: CreateSessionDto = {
      tenantId: "t1",
      groupId: "g1",
      startsAt: new Date("2025-01-01T09:00:00Z"),
      endsAt: new Date("2025-01-01T10:00:00Z"),
      title: "Kids service",
    };
    serviceMock.create.mockResolvedValueOnce(baseSession);
    const res = await controller.create(dto);
    expect(res).toEqual(baseSession);
    expect(serviceMock.create).toHaveBeenCalledWith(dto);
  });

  it("create should 400 when endsAt <= startsAt (DTO validation)", async () => {
    const bad: CreateSessionDto = {
      tenantId: "t1",
      groupId: "g1",
      startsAt: new Date("2025-01-01T10:00:00Z"),
      endsAt: new Date("2025-01-01T09:00:00Z"),
      title: "Bad times",
    };

    await expect(controller.create(bad)).rejects.toBeInstanceOf(
      BadRequestException,
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

    const res = await controller.update(baseSession.id, dto);
    expect(res).toEqual(updated);
    expect(serviceMock.update).toHaveBeenCalledWith(baseSession.id, dto);
  });

  it("update should 400 when endsAt <= startsAt (DTO validation)", async () => {
    const bad: UpdateSessionDto = {
      startsAt: new Date("2025-01-01T11:00:00Z"),
      endsAt: new Date("2025-01-01T10:00:00Z"),
    };
    await expect(controller.update("sess-1", bad)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(serviceMock.update).not.toHaveBeenCalled();
  });
});
