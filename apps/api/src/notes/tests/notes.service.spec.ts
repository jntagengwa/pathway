import { BadRequestException, NotFoundException } from "@nestjs/common";
import { NotesService } from "../notes.service";

// Types used in tests
type Note = {
  id: string;
  childId: string;
  authorId: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
};

// Prisma mocks
const childFindUnique = jest.fn<Promise<{ id: string } | null>, [unknown]>();
const userFindUnique = jest.fn<Promise<{ id: string } | null>, [unknown]>();
const noteCreate = jest.fn<Promise<Note>, [unknown]>();
const noteUpdate = jest.fn<Promise<Note>, [unknown]>();
const noteDelete = jest.fn<Promise<{ id: string }>, [unknown]>();
const noteFindUnique = jest.fn<Promise<Note | null>, [unknown]>();
const noteFindMany = jest.fn<Promise<Note[]>, [unknown]>();

jest.mock("@pathway/db", () => ({
  prisma: {
    child: { findUnique: (arg: unknown) => childFindUnique(arg) },
    user: { findUnique: (arg: unknown) => userFindUnique(arg) },
    childNote: {
      create: (arg: unknown) => noteCreate(arg),
      update: (arg: unknown) => noteUpdate(arg),
      delete: (arg: unknown) => noteDelete(arg),
      findUnique: (arg: unknown) => noteFindUnique(arg),
      findMany: (arg: unknown) => noteFindMany(arg),
    },
  },
}));

describe("NotesService", () => {
  let service: NotesService;
  const childId = "11111111-1111-1111-1111-111111111111";
  const authorId = "22222222-2222-2222-2222-222222222222";
  const noteId = "33333333-3333-3333-3333-333333333333";

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NotesService();
  });

  describe("create", () => {
    it("creates a note when child and author exist", async () => {
      childFindUnique.mockResolvedValue({ id: childId });
      userFindUnique.mockResolvedValue({ id: authorId });
      const created: Note = {
        id: noteId,
        childId,
        authorId,
        text: "Hello",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      noteCreate.mockResolvedValue(created);

      const res = await service.create({ childId, authorId, text: "Hello" });
      expect(childFindUnique).toHaveBeenCalledWith({
        where: { id: childId },
        select: { id: true },
      });
      expect(userFindUnique).toHaveBeenCalledWith({
        where: { id: authorId },
        select: { id: true },
      });
      expect(noteCreate).toHaveBeenCalled();
      expect(res).toEqual(created);
    });

    it("throws NotFound when child missing", async () => {
      childFindUnique.mockResolvedValue(null);
      userFindUnique.mockResolvedValue({ id: authorId });
      await expect(
        service.create({ childId, authorId, text: "x" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(noteCreate).not.toHaveBeenCalled();
    });

    it("throws NotFound when author missing", async () => {
      childFindUnique.mockResolvedValue({ id: childId });
      userFindUnique.mockResolvedValue(null);
      await expect(
        service.create({ childId, authorId, text: "x" }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(noteCreate).not.toHaveBeenCalled();
    });

    it("maps Prisma FK error to BadRequest", async () => {
      childFindUnique.mockResolvedValue({ id: childId });
      userFindUnique.mockResolvedValue({ id: authorId });
      noteCreate.mockRejectedValue({ code: "P2003", message: "fk" });
      await expect(
        service.create({ childId, authorId, text: "x" }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe("findAll", () => {
    it("passes filters and returns list", async () => {
      const items: Note[] = [
        {
          id: noteId,
          childId,
          authorId,
          text: "t",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      noteFindMany.mockResolvedValue(items);
      const res = await service.findAll({ childId, authorId });
      expect(noteFindMany).toHaveBeenCalled();
      expect(Array.isArray(res)).toBe(true);
      expect(res[0].childId).toBe(childId);
    });
  });

  describe("findOne", () => {
    it("returns note when found", async () => {
      const item: Note = {
        id: noteId,
        childId,
        authorId,
        text: "t",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      noteFindUnique.mockResolvedValue(item);
      const res = await service.findOne(noteId);
      expect(res).toEqual(item);
    });

    it("throws NotFound when missing", async () => {
      noteFindUnique.mockResolvedValue(null);
      await expect(service.findOne(noteId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("update", () => {
    it("updates text and returns note", async () => {
      const updated: Note = {
        id: noteId,
        childId,
        authorId,
        text: "updated",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      noteUpdate.mockResolvedValue(updated);
      const res = await service.update(noteId, { text: "updated" });
      expect(noteUpdate).toHaveBeenCalled();
      expect(res).toEqual(updated);
    });

    it("maps P2025 to NotFound on update", async () => {
      noteUpdate.mockRejectedValue({ code: "P2025", message: "not found" });
      await expect(
        service.update(noteId, { text: "x" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("remove", () => {
    it("deletes by id and returns payload", async () => {
      const deleted: { id: string } = { id: noteId };
      noteDelete.mockResolvedValue(deleted);
      const res = await service.remove(noteId);
      expect(res).toEqual(deleted);
    });

    it("maps P2025 to NotFound on delete", async () => {
      noteDelete.mockRejectedValue({ code: "P2025", message: "not found" });
      await expect(service.remove(noteId)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it("maps P2003 to BadRequest on delete", async () => {
      noteDelete.mockRejectedValue({ code: "P2003", message: "fk" });
      await expect(service.remove(noteId)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });
});
