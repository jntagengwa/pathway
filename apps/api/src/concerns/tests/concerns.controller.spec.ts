import { ConcernsController } from "../concerns.controller";
import { ConcernsService } from "../concerns.service";

// Types for strong typing in tests
interface Concern {
  id: string;
  childId: string;
  summary: string;
  details: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateBody {
  childId: string;
  summary: string; // raw body from client
  details?: string;
}

interface UpdateBody {
  summary?: string;
  details?: string;
}

interface ListQuery {
  childId?: string;
}

// Typed mock for ConcernsService
const mockService = () => ({
  create: jest.fn<Promise<Concern>, [CreateBody, unknown]>(),
  findAll: jest.fn<Promise<Concern[]>, [{ childId?: string }, unknown]>(),
  findOne: jest.fn<Promise<Concern>, [string, unknown]>(),
  update: jest.fn<Promise<Concern>, [string, UpdateBody, unknown]>(),
  remove: jest.fn<Promise<{ id: string }>, [string, unknown]>(),
});

describe("ConcernsController", () => {
  let controller: ConcernsController;
  let service: ReturnType<typeof mockService>;

  const childId = "11111111-1111-1111-1111-111111111111";
  const id = "22222222-2222-2222-2222-222222222222";
  const tenantId = "33333333-3333-3333-3333-333333333333";
  const orgId = "44444444-4444-4444-4444-444444444444";
  const userId = "55555555-5555-5555-5555-555555555555";
  beforeEach(() => {
    service = mockService();
    controller = new ConcernsController(service as unknown as ConcernsService);
  });

  describe("create", () => {
    it("parses body and calls service.create", async () => {
      const body: CreateBody = {
        childId,
        summary: "  Behavioural issue  ",
        details: "  Talked during lesson  ",
      };
      const created: Concern = {
        id,
        childId,
        summary: "Behavioural issue",
        details: "Talked during lesson",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      service.create.mockResolvedValue(created);

      const res = await controller.create(
        body as unknown,
        tenantId,
        orgId,
        userId,
      );
      expect(service.create).toHaveBeenCalledTimes(1);
      const arg = service.create.mock.calls[0][0] as {
        childId: string;
        summary: string;
        details?: string;
      };
      expect(arg.childId).toBe(childId);
      expect(typeof arg.summary).toBe("string");
      expect(res).toEqual(created);
      expect(service.create).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ tenantId, orgId, actorUserId: userId }),
      );
    });
  });

  describe("findAll", () => {
    it("parses query and forwards filters", async () => {
      const query: ListQuery = { childId };
      const items: Concern[] = [
        {
          id,
          childId,
          summary: "s",
          details: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      service.findAll.mockResolvedValue(items);

      const res = await controller.findAll(
        query as unknown,
        tenantId,
        orgId,
        userId,
      );
      expect(service.findAll).toHaveBeenCalledTimes(1);
      const filters = service.findAll.mock.calls[0][0];
      expect(filters).toEqual({ childId });
      expect(service.findAll).toHaveBeenCalledWith(
        { childId },
        expect.objectContaining({ tenantId, orgId, actorUserId: userId }),
      );
      expect(res).toEqual(items);
    });
  });

  describe("findOne", () => {
    it("validates id and returns concern", async () => {
      const item: Concern = {
        id,
        childId,
        summary: "s",
        details: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      service.findOne.mockResolvedValue(item);
      const res = await controller.findOne(
        { id } as unknown,
        tenantId,
        orgId,
        userId,
      );
      expect(service.findOne).toHaveBeenCalledWith(
        id,
        expect.objectContaining({ tenantId, orgId, actorUserId: userId }),
      );
      expect(res).toEqual(item);
    });
  });

  describe("update", () => {
    it("parses body and calls service.update", async () => {
      const patch: UpdateBody = { summary: "Updated", details: "Adjusted" };
      const updated: Concern = {
        id,
        childId,
        summary: "Updated",
        details: "Adjusted",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      service.update.mockResolvedValue(updated);

      const res = await controller.update(
        { id } as unknown,
        patch as unknown,
        tenantId,
        orgId,
        userId,
      );
      expect(service.update).toHaveBeenCalledTimes(1);
      const arg = service.update.mock.calls[0][1] as {
        summary?: string;
        details?: string;
      };
      expect(arg.summary).toBe("Updated");
      expect(arg.details).toBe("Adjusted");
      expect(res).toEqual(updated);
      expect(service.update).toHaveBeenCalledWith(
        id,
        arg,
        expect.objectContaining({ tenantId, orgId, actorUserId: userId }),
      );
    });
  });

  describe("remove", () => {
    it("validates id and calls service.remove", async () => {
      const deleted: { id: string } = { id };
      service.remove.mockResolvedValue(deleted);
      const res = await controller.remove(
        { id } as unknown,
        tenantId,
        orgId,
        userId,
      );
      expect(service.remove).toHaveBeenCalledWith(
        id,
        expect.objectContaining({ tenantId, orgId, actorUserId: userId }),
      );
      expect(res).toEqual(deleted);
    });
  });
});
