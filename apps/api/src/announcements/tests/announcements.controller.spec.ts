import { Test } from "@nestjs/testing";
import { AnnouncementsController } from "../announcements.controller";
import { AnnouncementsService } from "../announcements.service";

// Types used for strong typing in tests
type Audience = "ALL" | "PARENTS" | "STAFF";

type Announcement = {
  id: string;
  tenantId: string;
  title: string;
  body: string;
  audience: Audience;
  publishedAt: Date | null;
};

type CreateAnnouncementBody = {
  tenantId: string;
  title: string;
  body: string;
  audience?: Audience;
  publishedAt?: string; // raw ISO date from client
};

type UpdateAnnouncementBody = {
  title?: string;
  body?: string;
  audience?: Audience;
  publishedAt?: string; // raw ISO date from client
};

type ListQuery = {
  tenantId?: string;
  audience?: Audience;
  publishedOnly?: string | boolean; // comes from query string; controller coerces boolean
};

// Typed mock factory for the service
const mockService = () => ({
  create: jest.fn<Promise<Announcement>, [unknown]>(),
  findAll: jest.fn<
    Promise<Announcement[]>,
    [{ tenantId?: string; audience?: Audience; publishedOnly?: boolean }]
  >(),
  findOne: jest.fn<Promise<Announcement>, [string]>(),
  update: jest.fn<Promise<Announcement>, [string, unknown]>(),
  remove: jest.fn<Promise<{ id: string }>, [string]>(),
});

describe("AnnouncementsController", () => {
  let controller: AnnouncementsController;
  let service: ReturnType<typeof mockService>;

  const tenantId = "11111111-1111-1111-1111-111111111111";
  const id = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AnnouncementsController],
      providers: [{ provide: AnnouncementsService, useFactory: mockService }],
    }).compile();

    controller = moduleRef.get(AnnouncementsController);
    service = moduleRef.get(AnnouncementsService);
  });

  describe("create", () => {
    it("parses body and calls service.create", async () => {
      const body: CreateAnnouncementBody = {
        tenantId,
        title: "Welcome",
        body: "We are live!",
        audience: "ALL",
        publishedAt: "2025-01-10",
      };
      const created: Announcement = {
        id,
        tenantId,
        title: body.title,
        body: body.body,
        audience: "ALL",
        publishedAt: new Date("2025-01-10T00:00:00.000Z"),
      };

      service.create.mockResolvedValue(created);

      const res = await controller.create(body as unknown);
      expect(service.create).toHaveBeenCalledTimes(1);
      const arg = service.create.mock.calls[0][0] as {
        tenantId: string;
        title: string;
        body: string;
        audience: Audience;
        publishedAt: Date | null;
      };
      expect(arg.tenantId).toBe(tenantId);
      expect(arg.publishedAt instanceof Date || arg.publishedAt === null).toBe(
        true,
      );
      expect(res).toEqual(created);
    });
  });

  describe("findAll", () => {
    it("parses query and forwards filters", async () => {
      const query: ListQuery = {
        tenantId,
        audience: "PARENTS",
        publishedOnly: "true",
      };
      const items: Announcement[] = [
        {
          id,
          tenantId,
          title: "Parent msg",
          body: "hello",
          audience: "PARENTS",
          publishedAt: new Date("2025-01-10T00:00:00.000Z"),
        },
      ];
      service.findAll.mockResolvedValue(items);

      const res = await controller.findAll(query as unknown);
      expect(service.findAll).toHaveBeenCalledTimes(1);
      const filters = service.findAll.mock.calls[0][0];
      expect(filters).toEqual({
        tenantId,
        audience: "PARENTS",
        publishedOnly: true,
      });
      expect(res).toEqual(items);
    });
  });

  describe("findOne", () => {
    it("validates id and returns item", async () => {
      const item: Announcement = {
        id,
        tenantId,
        title: "t",
        body: "b",
        audience: "ALL",
        publishedAt: null,
      };
      service.findOne.mockResolvedValue(item);
      const res = await controller.findOne({ id } as unknown);
      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(res).toEqual(item);
    });
  });

  describe("update", () => {
    it("parses body and calls service.update", async () => {
      const patch: UpdateAnnouncementBody = {
        title: "Updated",
        audience: "STAFF",
        publishedAt: "2025-01-12",
      };
      const updated: Announcement = {
        id,
        tenantId,
        title: "Updated",
        body: "b",
        audience: "STAFF",
        publishedAt: new Date("2025-01-12T00:00:00.000Z"),
      };
      service.update.mockResolvedValue(updated);

      const res = await controller.update({ id } as unknown, patch as unknown);
      expect(service.update).toHaveBeenCalledTimes(1);
      const arg = service.update.mock.calls[0][1] as {
        title?: string;
        audience?: Audience;
        publishedAt?: Date;
      };
      expect(arg.audience).toBe("STAFF");
      expect(arg.publishedAt instanceof Date).toBe(true);
      expect(res).toEqual(updated);
    });
  });

  describe("remove", () => {
    it("validates id and calls service.remove", async () => {
      const deleted: { id: string } = { id };
      service.remove.mockResolvedValue(deleted);
      const res = await controller.remove({ id } as unknown);
      expect(service.remove).toHaveBeenCalledWith(id);
      expect(res).toEqual(deleted);
    });
  });
});
