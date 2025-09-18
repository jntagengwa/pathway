import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@pathway/db";
import type { Prisma } from "@pathway/db";
import { createConcernDto, updateConcernDto } from "./dto";

@Injectable()
export class ConcernsService {
  async create(raw: unknown) {
    const dto = await createConcernDto.parseAsync(raw);

    // Validate FK: child must exist
    const child = await prisma.child.findUnique({
      where: { id: dto.childId },
      select: { id: true },
    });
    if (!child) throw new NotFoundException("Child not found");

    try {
      return await prisma.concern.create({
        data: {
          childId: dto.childId,
          summary: dto.summary,
          details: dto.details ?? undefined,
        },
      });
    } catch (e: unknown) {
      this.handlePrismaError(e, "create");
    }
  }

  async findAll(filters: { childId?: string } = {}) {
    const where: Prisma.ConcernWhereInput = {
      ...(filters.childId ? { childId: filters.childId } : {}),
    };
    return prisma.concern.findMany({ where, orderBy: { createdAt: "desc" } });
  }

  async findOne(id: string) {
    const c = await prisma.concern.findUnique({ where: { id } });
    if (!c) throw new NotFoundException("Concern not found");
    return c;
  }

  async update(id: string, raw: unknown) {
    const dto = await updateConcernDto.parseAsync(raw);
    try {
      return await prisma.concern.update({
        where: { id },
        data: {
          summary: dto.summary ?? undefined,
          details: dto.details ?? undefined,
        },
      });
    } catch (e: unknown) {
      this.handlePrismaError(e, "update", id);
    }
  }

  async remove(id: string) {
    try {
      return await prisma.concern.delete({ where: { id } });
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
        id ? `Concern with id ${id} not found` : "Concern not found",
      );
    }
    if (code === "P2003") {
      throw new BadRequestException(
        `Invalid reference for concern ${action}: ${message}`,
      );
    }
    if (code === "P2002") {
      throw new BadRequestException(
        `Duplicate value violates a unique constraint: ${message}`,
      );
    }
    throw new BadRequestException(`Failed to ${action} concern: ${message}`);
  }
}
