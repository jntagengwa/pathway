import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@pathway/db";
import type { Prisma } from "@pathway/db";
import { CreateLessonDto, UpdateLessonDto } from "./dto";

@Injectable()
export class LessonsService {
  /** Create a lesson. Validates tenant and (optional) group ownership. */
  async create(dto: CreateLessonDto) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: dto.tenantId },
      select: { id: true },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");

    if (dto.groupId) {
      const group = await prisma.group.findUnique({
        where: { id: dto.groupId },
        select: { id: true, tenantId: true },
      });
      if (!group) throw new NotFoundException("Group not found");
      if (group.tenantId !== dto.tenantId) {
        throw new BadRequestException("Group must belong to the same tenant");
      }
    }

    try {
      return await prisma.lesson.create({
        data: {
          tenantId: dto.tenantId,
          groupId: dto.groupId ?? null,
          title: dto.title,
          description: dto.description ?? null,
          fileKey: dto.fileKey ?? null,
          weekOf: dto.weekOf,
        },
      });
    } catch (e: unknown) {
      this.handlePrismaError(e, "create");
    }
  }

  /** List lessons with optional filters. */
  async findAll(
    filters: {
      tenantId?: string;
      groupId?: string;
      weekOfFrom?: Date;
      weekOfTo?: Date;
    } = {},
  ) {
    const where: Prisma.LessonWhereInput = {
      ...(filters.tenantId ? { tenantId: filters.tenantId } : {}),
      ...(filters.groupId ? { groupId: filters.groupId } : {}),
      ...(filters.weekOfFrom || filters.weekOfTo
        ? {
            weekOf: {
              ...(filters.weekOfFrom ? { gte: filters.weekOfFrom } : {}),
              ...(filters.weekOfTo ? { lte: filters.weekOfTo } : {}),
            },
          }
        : {}),
    };

    return prisma.lesson.findMany({ where, orderBy: { weekOf: "desc" } });
  }

  async findOne(id: string) {
    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) throw new NotFoundException("Lesson not found");
    return lesson;
  }

  /** Update a lesson. Tenant is immutable; optionally validate new group. */
  async update(id: string, dto: UpdateLessonDto) {
    const existing = await prisma.lesson.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Lesson not found");

    // Validate group tenant ownership if groupId is provided (including explicit null to detach)
    if (dto.groupId !== undefined && dto.groupId !== null) {
      const group = await prisma.group.findUnique({
        where: { id: dto.groupId },
        select: { id: true, tenantId: true },
      });
      if (!group) throw new NotFoundException("Group not found");
      if (group.tenantId !== existing.tenantId) {
        throw new BadRequestException(
          "Group must belong to the same tenant as the lesson",
        );
      }
    }

    try {
      return await prisma.lesson.update({
        where: { id },
        data: {
          // tenantId is intentionally not mutable
          groupId: dto.groupId === undefined ? undefined : dto.groupId, // allow null to detach
          title: dto.title ?? undefined,
          description:
            dto.description === undefined ? undefined : dto.description,
          fileKey: dto.fileKey === undefined ? undefined : dto.fileKey,
          weekOf: dto.weekOf ?? undefined,
        },
      });
    } catch (e: unknown) {
      this.handlePrismaError(e, "update", id);
    }
  }

  async remove(id: string) {
    try {
      return await prisma.lesson.delete({ where: { id } });
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
      // Record not found (mostly for update/delete)
      throw new NotFoundException(
        id ? `Lesson with id ${id} not found` : "Lesson not found",
      );
    }

    if (code === "P2002") {
      // Unique constraint failed
      throw new BadRequestException(
        `Duplicate value violates a unique constraint: ${message}`,
      );
    }

    if (code === "P2003") {
      // Foreign key constraint failed
      throw new BadRequestException(
        `Invalid reference for lesson ${action}: ${message}`,
      );
    }

    throw new BadRequestException(`Failed to ${action} lesson: ${message}`);
  }
}
