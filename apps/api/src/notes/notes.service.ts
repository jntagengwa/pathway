import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@pathway/db";
import type { Prisma } from "@pathway/db";
import { createNoteDto, updateNoteDto } from "./dto";

@Injectable()
export class NotesService {
  async create(raw: unknown) {
    const dto = await createNoteDto.parseAsync(raw);

    // Validate foreign keys explicitly for clearer errors
    const [child, author] = await Promise.all([
      prisma.child.findUnique({
        where: { id: dto.childId },
        select: { id: true },
      }),
      prisma.user.findUnique({
        where: { id: dto.authorId },
        select: { id: true },
      }),
    ]);
    if (!child) throw new NotFoundException("Child not found");
    if (!author) throw new NotFoundException("Author not found");

    try {
      return await prisma.childNote.create({
        data: {
          childId: dto.childId,
          authorId: dto.authorId,
          text: dto.text,
        },
      });
    } catch (e: unknown) {
      this.handlePrismaError(e, "create");
    }
  }

  async findAll(filters: { childId?: string; authorId?: string } = {}) {
    const where: Prisma.ChildNoteWhereInput = {
      ...(filters.childId ? { childId: filters.childId } : {}),
      ...(filters.authorId ? { authorId: filters.authorId } : {}),
    };
    return prisma.childNote.findMany({ where, orderBy: { createdAt: "desc" } });
  }

  async findOne(id: string) {
    const note = await prisma.childNote.findUnique({ where: { id } });
    if (!note) throw new NotFoundException("Note not found");
    return note;
  }

  async update(id: string, raw: unknown) {
    const dto = await updateNoteDto.parseAsync(raw);
    try {
      return await prisma.childNote.update({
        where: { id },
        data: {
          text: dto.text ?? undefined,
        },
      });
    } catch (e: unknown) {
      this.handlePrismaError(e, "update", id);
    }
  }

  async remove(id: string) {
    try {
      return await prisma.childNote.delete({ where: { id } });
    } catch (e: unknown) {
      this.handlePrismaError(e, "delete", id);
    }
  }

  private handlePrismaError(
    e: unknown,
    action: "create" | "update" | "delete",
    id?: string,
  ): never {
    const code =
      typeof e === "object" && e !== null && "code" in e
        ? String((e as { code?: unknown }).code)
        : undefined;
    const message =
      typeof e === "object" &&
      e !== null &&
      "message" in e &&
      typeof (e as { message?: unknown }).message === "string"
        ? (e as { message: string }).message
        : "Unknown error";

    if (code === "P2025") {
      throw new NotFoundException(
        id ? `Note with id ${id} not found` : "Note not found",
      );
    }
    if (code === "P2003") {
      throw new BadRequestException(
        `Invalid reference for note ${action}: ${message}`,
      );
    }
    if (code === "P2002") {
      throw new BadRequestException(
        `Duplicate value violates a unique constraint: ${message}`,
      );
    }
    throw new BadRequestException(`Failed to ${action} note: ${message}`);
  }
}
