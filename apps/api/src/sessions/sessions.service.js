var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, BadRequestException, NotFoundException, ConflictException, } from "@nestjs/common";
import { prisma } from "@pathway/db";
import { createSessionSchema, } from "./dto/create-session.dto";
import { updateSessionSchema, } from "./dto/update-session.dto";
let SessionsService = class SessionsService {
    handlePrismaError(e, action) {
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
            throw new NotFoundException("Session not found");
        }
        if (code === "P2002") {
            throw new ConflictException("Duplicate session violates a unique constraint");
        }
        if (code === "P2003") {
            throw new BadRequestException(`Invalid reference on ${action}: ${message}`);
        }
        throw new BadRequestException(`Failed to ${action} session: ${message}`);
    }
    async list(filters) {
        const where = { tenantId: filters.tenantId };
        if (filters.groupId)
            where.groupId = filters.groupId;
        const andClauses = [];
        const { from, to } = filters;
        if (from && to) {
            // overlapping window: startsAt <= to AND endsAt >= from
            andClauses.push({ startsAt: { lte: to } });
            andClauses.push({ endsAt: { gte: from } });
        }
        else if (from) {
            andClauses.push({ endsAt: { gte: from } });
        }
        else if (to) {
            andClauses.push({ startsAt: { lte: to } });
        }
        if (andClauses.length)
            where.AND = andClauses;
        return prisma.session.findMany({
            where,
            orderBy: { startsAt: "asc" },
        });
    }
    async getById(id, tenantId) {
        const s = await prisma.session.findFirst({ where: { id, tenantId } });
        if (!s)
            throw new NotFoundException("Session not found");
        return s;
    }
    async create(input, tenantId) {
        // Normalize & validate (map Zod errors to HTTP 400)
        let parsed;
        try {
            parsed = createSessionSchema.parse(input);
        }
        catch {
            throw new BadRequestException("invalid body");
        }
        if (parsed.tenantId !== tenantId) {
            throw new BadRequestException("tenantId must match current tenant");
        }
        if (parsed.endsAt.getTime() <= parsed.startsAt.getTime()) {
            throw new BadRequestException("endsAt must be after startsAt");
        }
        // ensure tenant exists for clearer error than FK violation
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true },
        });
        if (!tenant)
            throw new BadRequestException("tenant not found");
        // optional group tenant check
        if (parsed.groupId) {
            const grp = await prisma.group.findUnique({
                where: { id: parsed.groupId },
                select: { tenantId: true },
            });
            if (!grp)
                throw new BadRequestException("group not found");
            if (grp.tenantId !== tenantId)
                throw new BadRequestException("group/tenant mismatch");
        }
        // At this point inputs are valid and tenant/group consistency is checked
        try {
            const created = await prisma.session.create({
                data: {
                    tenantId,
                    groupId: parsed.groupId ?? null,
                    startsAt: parsed.startsAt,
                    endsAt: parsed.endsAt,
                    title: parsed.title?.trim() ?? null,
                },
            });
            return created;
        }
        catch (e) {
            this.handlePrismaError(e, "create");
        }
    }
    async update(id, input, tenantId) {
        const changes = updateSessionSchema.parse(input);
        // Fetch current for cross-field validation when only one date is provided
        const current = await prisma.session.findFirst({
            where: { id, tenantId },
            select: { tenantId: true, groupId: true, startsAt: true, endsAt: true },
        });
        if (!current)
            throw new NotFoundException("Session not found");
        // Prevent cross-tenant changes
        if (changes.tenantId && changes.tenantId !== tenantId) {
            throw new BadRequestException("tenantId must match current tenant");
        }
        // If groupId provided, validate tenant match
        if (typeof changes.groupId !== "undefined" && changes.groupId !== null) {
            const grp = await prisma.group.findUnique({
                where: { id: changes.groupId },
                select: { tenantId: true },
            });
            if (!grp)
                throw new BadRequestException("group not found");
            const targetTenantId = tenantId;
            if (grp.tenantId !== targetTenantId)
                throw new BadRequestException("group/tenant mismatch");
        }
        // If tenantId provided, ensure it exists
        if (typeof changes.tenantId !== "undefined") {
            const t = await prisma.tenant.findUnique({
                where: { id: changes.tenantId },
                select: { id: true },
            });
            if (!t)
                throw new BadRequestException("tenant not found");
            // If current or incoming group is set, re-validate group/tenant consistency
            const candidateGroupId = typeof changes.groupId === "undefined"
                ? current.groupId
                : changes.groupId;
            if (candidateGroupId) {
                const grp = await prisma.group.findUnique({
                    where: { id: candidateGroupId },
                    select: { tenantId: true },
                });
                if (!grp)
                    throw new BadRequestException("group not found");
                if (grp.tenantId !== tenantId)
                    throw new BadRequestException("group/tenant mismatch");
            }
        }
        // Validate date ordering if only one boundary provided
        const nextStarts = changes.startsAt ?? current.startsAt;
        const nextEnds = changes.endsAt ?? current.endsAt;
        if (nextEnds <= nextStarts)
            throw new BadRequestException("endsAt must be after startsAt");
        try {
            const updated = await prisma.session.update({
                where: { id },
                data: {
                    tenantId: current.tenantId,
                    groupId: typeof changes.groupId === "undefined"
                        ? current.groupId
                        : (changes.groupId ?? null),
                    startsAt: nextStarts,
                    endsAt: nextEnds,
                    title: typeof changes.title === "undefined"
                        ? undefined
                        : (changes.title?.trim() ?? null),
                },
            });
            return updated;
        }
        catch (e) {
            this.handlePrismaError(e, "update");
        }
    }
    async delete(id, tenantId) {
        try {
            const existing = await prisma.session.findFirst({
                where: { id, tenantId },
                select: { id: true },
            });
            if (!existing)
                throw new NotFoundException("Session not found");
            await prisma.session.delete({ where: { id } });
            return { id };
        }
        catch (e) {
            this.handlePrismaError(e, "delete");
        }
    }
};
SessionsService = __decorate([
    Injectable()
], SessionsService);
export { SessionsService };
