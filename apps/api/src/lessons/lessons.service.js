var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BadRequestException, Injectable, NotFoundException, } from "@nestjs/common";
import { prisma } from "@pathway/db";
let LessonsService = class LessonsService {
    /** Create a lesson. Validates tenant and (optional) group ownership. */
    async create(dto, tenantId) {
        if (dto.tenantId !== tenantId) {
            throw new BadRequestException("tenantId must match current tenant");
        }
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true },
        });
        if (!tenant)
            throw new NotFoundException("Tenant not found");
        if (dto.groupId) {
            const group = await prisma.group.findUnique({
                where: { id: dto.groupId },
                select: { id: true, tenantId: true },
            });
            if (!group)
                throw new NotFoundException("Group not found");
            if (group.tenantId !== tenantId) {
                throw new BadRequestException("Group must belong to the same tenant");
            }
        }
        try {
            return await prisma.lesson.create({
                data: {
                    tenantId,
                    groupId: dto.groupId ?? null,
                    title: dto.title,
                    description: dto.description ?? null,
                    fileKey: dto.fileKey ?? null,
                    weekOf: dto.weekOf,
                },
            });
        }
        catch (e) {
            this.handlePrismaError(e, "create");
        }
    }
    /** List lessons with optional filters. */
    async findAll(filters) {
        // tenantId is required; caller must supply from context
        const where = {
            tenantId: filters.tenantId,
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
    async findOne(id, tenantId) {
        const lesson = await prisma.lesson.findFirst({ where: { id, tenantId } });
        if (!lesson)
            throw new NotFoundException("Lesson not found");
        return lesson;
    }
    /** Update a lesson. Tenant is immutable; optionally validate new group. */
    async update(id, dto, tenantId) {
        const existing = await prisma.lesson.findFirst({ where: { id, tenantId } });
        if (!existing)
            throw new NotFoundException("Lesson not found");
        // Validate group tenant ownership if groupId is provided (including explicit null to detach)
        if (dto.groupId !== undefined && dto.groupId !== null) {
            const group = await prisma.group.findUnique({
                where: { id: dto.groupId },
                select: { id: true, tenantId: true },
            });
            if (!group)
                throw new NotFoundException("Group not found");
            if (group.tenantId !== existing.tenantId) {
                throw new BadRequestException("Group must belong to the same tenant as the lesson");
            }
        }
        try {
            return await prisma.lesson.update({
                where: { id },
                data: {
                    // tenantId is intentionally not mutable
                    groupId: dto.groupId === undefined ? undefined : dto.groupId, // allow null to detach
                    title: dto.title ?? undefined,
                    description: dto.description === undefined ? undefined : dto.description,
                    fileKey: dto.fileKey === undefined ? undefined : dto.fileKey,
                    weekOf: dto.weekOf ?? undefined,
                },
            });
        }
        catch (e) {
            this.handlePrismaError(e, "update", id);
        }
    }
    async remove(id, tenantId) {
        try {
            const existing = await prisma.lesson.findFirst({
                where: { id, tenantId },
            });
            if (!existing)
                throw new NotFoundException("Lesson not found");
            return await prisma.lesson.delete({ where: { id } });
        }
        catch (e) {
            this.handlePrismaError(e, "delete", id);
        }
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
            // Record not found (mostly for update/delete)
            throw new NotFoundException(id ? `Lesson with id ${id} not found` : "Lesson not found");
        }
        if (code === "P2002") {
            // Unique constraint failed
            throw new BadRequestException(`Duplicate value violates a unique constraint: ${message}`);
        }
        if (code === "P2003") {
            // Foreign key constraint failed
            throw new BadRequestException(`Invalid reference for lesson ${action}: ${message}`);
        }
        throw new BadRequestException(`Failed to ${action} lesson: ${message}`);
    }
};
LessonsService = __decorate([
    Injectable()
], LessonsService);
export { LessonsService };
