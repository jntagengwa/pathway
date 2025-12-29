var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { BadRequestException, Injectable, NotFoundException, Inject, } from "@nestjs/common";
import { prisma } from "@pathway/db";
import { AuditService } from "../audit/audit.service";
import { AuditAction, AuditEntityType } from "../audit/audit.types";
let NotesService = class NotesService {
    audit;
    constructor(audit) {
        this.audit = audit;
    }
    async create(dto, authorId, context) {
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
        if (!child)
            throw new NotFoundException("Child not found");
        if (!author)
            throw new NotFoundException("Author not found");
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
        }
        catch (e) {
            this.handlePrismaError(e, "create");
        }
    }
    async findAll(filters = {}, context) {
        const where = {
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
    async findOne(id, context) {
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
    async update(id, dto, context) {
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
        }
        catch (e) {
            this.handlePrismaError(e, "update", id);
        }
    }
    async remove(id, context) {
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
        }
        catch (e) {
            this.handlePrismaError(e, "delete", id);
        }
    }
    async requireNoteForTenant(id, tenantId) {
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
    handlePrismaError(e, action, id) {
        const code = typeof e === "object" && e !== null && "code" in e
            ? String(e.code)
            : undefined;
        const message = typeof e === "object" &&
            e !== null &&
            "message" in e &&
            typeof e.message === "string"
            ? e.message
            : "Unknown error";
        if (code === "P2025") {
            throw new NotFoundException(id ? `Note with id ${id} not found` : "Note not found");
        }
        if (code === "P2003") {
            throw new BadRequestException(`Invalid reference for note ${action}: ${message}`);
        }
        if (code === "P2002") {
            throw new BadRequestException(`Duplicate value violates a unique constraint: ${message}`);
        }
        throw new BadRequestException(`Failed to ${action} note: ${message}`);
    }
};
NotesService = __decorate([
    Injectable(),
    __param(0, Inject(AuditService)),
    __metadata("design:paramtypes", [AuditService])
], NotesService);
export { NotesService };
