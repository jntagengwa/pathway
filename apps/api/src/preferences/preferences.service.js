var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@pathway/db";
let PreferencesService = class PreferencesService {
    /** Create a volunteer preference window */
    async create(dto, tenantId) {
        const resolvedTenantId = tenantId ?? dto.tenantId;
        if (!resolvedTenantId)
            throw new NotFoundException("tenant not found");
        return prisma.volunteerPreference.create({
            data: {
                userId: dto.userId,
                tenantId: resolvedTenantId,
                weekday: dto.weekday,
                startMinute: dto.startMinute,
                endMinute: dto.endMinute,
            },
        });
    }
    /**
     * List preferences with optional filters. Results are newest-first for test stability
     * and predictable pagination.
     */
    async findAll(filters) {
        return prisma.volunteerPreference.findMany({
            where: {
                userId: filters.userId,
                tenantId: filters.tenantId,
                weekday: filters.weekday,
                startMinute: typeof filters.startMinuteGte === "number"
                    ? { gte: filters.startMinuteGte }
                    : undefined,
                endMinute: typeof filters.endMinuteLte === "number"
                    ? { lte: filters.endMinuteLte }
                    : undefined,
            },
            orderBy: { createdAt: "desc" },
        });
    }
    /** Get a single preference by id */
    async findOne(id, tenantId) {
        const pref = await prisma.volunteerPreference.findFirst({
            where: { id, tenantId },
        });
        if (!pref)
            throw new NotFoundException(`Preference ${id} not found`);
        return pref;
    }
    /** Update an existing preference */
    async update(id, dto, tenantId) {
        const resolvedTenantId = tenantId ?? dto.tenantId;
        try {
            return await prisma.volunteerPreference.update({
                where: { id },
                data: {
                    // Only pass fields that may be present on the partial DTO
                    userId: dto.userId,
                    tenantId: resolvedTenantId,
                    weekday: dto.weekday,
                    startMinute: dto.startMinute,
                    endMinute: dto.endMinute,
                },
            });
        }
        catch (e) {
            // If Prisma throws because the record does not exist, surface a 404
            const existing = await prisma.volunteerPreference.findUnique({
                where: { id },
            });
            if (!existing)
                throw new NotFoundException(`Preference ${id} not found`);
            throw e;
        }
    }
    /** Delete and return the deleted preference */
    async remove(id, tenantId) {
        try {
            return await prisma.volunteerPreference.deleteMany({
                where: { id, tenantId },
            });
        }
        catch (e) {
            // Align error semantics with other modules
            const existing = await prisma.volunteerPreference.findFirst({
                where: { id, tenantId },
            });
            if (!existing)
                throw new NotFoundException(`Preference ${id} not found`);
            throw e;
        }
    }
};
PreferencesService = __decorate([
    Injectable()
], PreferencesService);
export { PreferencesService };
