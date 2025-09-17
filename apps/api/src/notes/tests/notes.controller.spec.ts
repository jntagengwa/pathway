import { Test } from "@nestjs/testing";
import { NotesController } from "../notes.controller";
import { NotesService } from "../notes.service";

// Types for strong typing in tests
interface Note {
  id: string;
  childId: string;
  authorId: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateBody {
  childId: string;
  authorId: string;
  text: string; // raw body from client
}

interface UpdateBody {
  text?: string;
}

interface ListQuery {
  childId?: string;
  authorId?: string;
}

// Typed mock for NotesService
const mockService = () => ({
  create: jest.fn<Promise<Note>, [unknown]>(),
  findAll: jest.fn<
    Promise<Note[]>,
    [{ childId?: string; authorId?: string }]
  >(),
  findOne: jest.fn<Promise<Note>, [string]>(),
  update: jest.fn<Promise<Note>, [string, unknown]>(),
  remove: jest.fn<Promise<{ id: string }>, [string]>(),
});

describe("NotesController", () => {
  let controller: NotesController;
  let service: ReturnType<typeof mockService>;

  const childId = "11111111-1111-1111-1111-111111111111";
  const authorId = "22222222-2222-2222-2222-222222222222";
  const id = "33333333-3333-3333-3333-333333333333";

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [NotesController],
      providers: [{ provide: NotesService, useFactory: mockService }],
    }).compile();

    controller = moduleRef.get(NotesController);
    service = moduleRef.get(NotesService);
  });

  describe("create", () => {
    it("parses body and calls service.create", async () => {
      const body: CreateBody = { childId, authorId, text: "  Hello  " };
      const created: Note = {
        id,
        childId,
        authorId,
        text: "Hello",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      service.create.mockResolvedValue(created);

      const res = await controller.create(body as unknown);
      expect(service.create).toHaveBeenCalledTimes(1);
      const arg = service.create.mock.calls[0][0] as {
        childId: string;
        authorId: string;
        text: string;
      };
      expect(arg.childId).toBe(childId);
      expect(arg.authorId).toBe(authorId);
      expect(typeof arg.text).toBe("string");
      expect(res).toEqual(created);
    });
  });

  describe("findAll", () => {
    it("parses query and forwards filters", async () => {
      const query: ListQuery = { childId, authorId };
      const items: Note[] = [
        {
          id,
          childId,
          authorId,
          text: "t",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      service.findAll.mockResolvedValue(items);

      const res = await controller.findAll(query as unknown);
      expect(service.findAll).toHaveBeenCalledTimes(1);
      const filters = service.findAll.mock.calls[0][0];
      expect(filters).toEqual({ childId, authorId });
      expect(res).toEqual(items);
    });
  });

  describe("findOne", () => {
    it("validates id and returns note", async () => {
      const item: Note = {
        id,
        childId,
        authorId,
        text: "t",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      service.findOne.mockResolvedValue(item);
      const res = await controller.findOne({ id } as unknown);
      expect(service.findOne).toHaveBeenCalledWith(id);
      expect(res).toEqual(item);
    });
  });

  describe("update", () => {
    it("parses body and calls service.update", async () => {
      const patch: UpdateBody = { text: "Updated" };
      const updated: Note = {
        id,
        childId,
        authorId,
        text: "Updated",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      service.update.mockResolvedValue(updated);

      const res = await controller.update({ id } as unknown, patch as unknown);
      expect(service.update).toHaveBeenCalledTimes(1);
      const arg = service.update.mock.calls[0][1] as { text?: string };
      expect(arg.text).toBe("Updated");
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
