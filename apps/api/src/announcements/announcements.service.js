var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { BadRequestException, Injectable, NotFoundException, } from "@nestjs/common";
import { prisma } from "@pathway/db";
import { createAnnouncementDto, updateAnnouncementDto } from "./dto";
let AnnouncementsService = class AnnouncementsService {
    constructor() { }
    async create(raw, tenantId) {
        const dto = await createAnnouncementDto.parseAsync(raw);
        if (dto.tenantId !== tenantId) {
            throw new BadRequestException("tenantId must match current tenant");
        }
        // Ensure tenant exists BEFORE attempting the create so 404 is not swallowed by catch
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true },
        });
        if (!tenant)
            throw new NotFoundException("Tenant not found");
        try {
            return await prisma.announcement.create({
                data: {
                    tenantId,
                    title: dto.title,
                    body: dto.body,
                    audience: dto.audience,
                    publishedAt: dto.publishedAt ?? null,
                },
            });
        }
        catch (e) {
            this.handlePrismaError(e, "create");
        }
    }
    async findAll(filters) {
        const where = {
            tenantId: filters.tenantId,
            ...(filters.audience ? { audience: filters.audience } : {}),
            ...(filters.publishedOnly ? { publishedAt: { not: null } } : {}),
        };
        return prisma.announcement.findMany({
            where,
            orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
        });
    }
    async findOne(id, tenantId) {
        const a = await prisma.announcement.findFirst({ where: { id, tenantId } });
        if (!a)
            throw new NotFoundException("Announcement not found");
        return a;
    }
    async update(id, raw, tenantId) {
        const dto = await updateAnnouncementDto.parseAsync(raw);
        const existing = await prisma.announcement.findFirst({
            where: { id, tenantId },
            select: { id: true },
        });
        if (!existing)
            throw new NotFoundException("Announcement not found");
        try {
            return await prisma.announcement.update({
                where: { id },
                data: {
                    title: dto.title ?? undefined,
                    body: dto.body ?? undefined,
                    audience: dto.audience ?? undefined,
                    publishedAt: dto.publishedAt ?? undefined,
                },
            });
        }
        catch (e) {
            this.handlePrismaError(e, "update", id);
        }
    }
    async remove(id, tenantId) {
        const existing = await prisma.announcement.findFirst({
            where: { id, tenantId },
            select: { id: true },
        });
        if (!existing)
            throw new NotFoundException("Announcement not found");
        try {
            return await prisma.announcement.delete({ where: { id } });
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
        if (code === "P2025")
            throw new NotFoundException(id ? `Announcement with id ${id} not found` : "Announcement not found");
        if (code === "P2002")
            throw new BadRequestException(`Duplicate value violates a unique constraint: ${message}`);
        if (code === "P2003")
            throw new BadRequestException(`Invalid reference for announcement ${action}: ${message}`);
        throw new BadRequestException(`Failed to ${action} announcement: ${message}`);
    }
};
AnnouncementsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], AnnouncementsService);
export { AnnouncementsService };
