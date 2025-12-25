import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
} from "@nestjs/common";
import { prisma } from "@pathway/db";
import type { Prisma } from "@prisma/client";
import type { CreateNoteDto, UpdateNoteDto } from "./dto";
import { AuditService } from "../audit/audit.service";
import type { SafeguardingContextIds } from "../common/safeguarding/safeguarding.types";
import { AuditAction, AuditEntityType } from "../audit/audit.types";

@Injectable()
export class NotesService {
  constructor(@Inject(AuditService) private readonly audit: AuditService) {}

  async create(
    dto: CreateNoteDto,
    authorId: string,
    context: SafeguardingContextIds,
  ) {
    // Validate foreign keys explicitly for clearer errors
    const [child, author] = await Promise.all([
      prisma.child.findFirst({
        where: { id: dto.childId, tenantId: context.tenantId },
        select: { id: true },
      }),
      prisma.user.findFirst({
        where: { id: authorId, tenantId: context.tenantId },
        select: { id: true },
      }),
    ]);
    if (!child) throw new NotFoundException("Child not found");
    if (!author) throw new NotFoundException("Author not found");

    try {
      const note = await prisma.childNote.create({
        data: {
          childId: dto.childId,
          authorId,
          text: dto.text,
          visibleToParents: false,
        },
      });
      await this.audit.recordEvent({
        actorUserId: context.actorUserId,
        tenantId: context.tenantId,
        orgId: context.orgId,
        entityType: AuditEntityType.CHILD_NOTE,
        entityId: note.id,
        action: AuditAction.CREATED,
        metadata: { childId: dto.childId },
      });
      return note;
    } catch (e: unknown) {
      this.handlePrismaError(e, "create");
    }
  }

  async findAll(
    filters: { childId?: string; authorId?: string } = {},
    context: SafeguardingContextIds,
  ) {
    const where: Prisma.ChildNoteWhereInput = {
      child: { tenantId: context.tenantId },
      ...(filters.childId ? { childId: filters.childId } : {}),
      ...(filters.authorId ? { authorId: filters.authorId } : {}),
    };
    const notes = await prisma.childNote.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    await this.audit.recordEvent({
      actorUserId: context.actorUserId,
      tenantId: context.tenantId,
      orgId: context.orgId,
      entityType: AuditEntityType.CHILD_NOTE,
      entityId: null,
      action: AuditAction.VIEWED,
      metadata: {
        filterChildId: filters.childId ?? null,
        filterAuthorId: filters.authorId ?? null,
        resultCount: notes.length,
      },
    });
    return notes;
  }

  async findOne(id: string, context: SafeguardingContextIds) {
    const note = await this.requireNoteForTenant(id, context.tenantId);
    await this.audit.recordEvent({
      actorUserId: context.actorUserId,
      tenantId: context.tenantId,
      orgId: context.orgId,
      entityType: AuditEntityType.CHILD_NOTE,
      entityId: id,
      action: AuditAction.VIEWED,
      metadata: { childId: note.childId },
    });
    return note;
  }

  async update(
    id: string,
    dto: UpdateNoteDto,
    context: SafeguardingContextIds,
  ) {
    await this.requireNoteForTenant(id, context.tenantId);
    try {
      const note = await prisma.childNote.update({
        where: { id },
        data: {
          text: dto.text ?? undefined,
          // TODO(Epic2-Task2.4): include visibility + approval updates when parent flows are implemented.
        },
      });
      await this.audit.recordEvent({
        actorUserId: context.actorUserId,
        tenantId: context.tenantId,
        orgId: context.orgId,
        entityType: AuditEntityType.CHILD_NOTE,
        entityId: id,
        action: AuditAction.UPDATED,
        metadata: {
          updatedFields: Object.keys(dto ?? {}),
        },
      });
      return note;
    } catch (e: unknown) {
      this.handlePrismaError(e, "update", id);
    }
  }

  async remove(id: string, context: SafeguardingContextIds) {
    const note = await this.requireNoteForTenant(id, context.tenantId);
    try {
      const deleted = await prisma.childNote.delete({ where: { id } });
      await this.audit.recordEvent({
        actorUserId: context.actorUserId,
        tenantId: context.tenantId,
        orgId: context.orgId,
        entityType: AuditEntityType.CHILD_NOTE,
        entityId: id,
        action: AuditAction.DELETED,
        metadata: { childId: note.childId },
      });
      return deleted;
    } catch (e: unknown) {
      this.handlePrismaError(e, "delete", id);
    }
  }

  private async requireNoteForTenant(id: string, tenantId: string) {
    const note = await prisma.childNote.findFirst({
      where: {
        id,
        child: { tenantId },
      },
    });
    if (!note) {
      throw new NotFoundException("Note not found");
    }
    return note;
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
