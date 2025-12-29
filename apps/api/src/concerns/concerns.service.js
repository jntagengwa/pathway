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
import { withTenantRlsContext } from "@pathway/db";
import { AuditService } from "../audit/audit.service";
import { AuditAction, AuditEntityType } from "../audit/audit.types";
let ConcernsService = class ConcernsService {
    audit;
    constructor(audit) {
        this.audit = audit;
    }
    async create(dto, context) {
        return this.withContext(context, async (tx) => {
            // Validate FK: child must exist for this tenant
            const child = await tx.child.findFirst({
                where: {
                    id: dto.childId,
                    tenantId: context.tenantId,
                },
                select: { id: true },
            });
            if (!child)
                throw new NotFoundException("Child not found");
            try {
                const concern = await tx.concern.create({
                    data: {
                        childId: dto.childId,
                        summary: dto.summary,
                        details: dto.details ?? undefined,
                    },
                });
                await this.audit.recordEvent({
                    actorUserId: context.actorUserId,
                    tenantId: context.tenantId,
                    orgId: context.orgId,
                    entityType: AuditEntityType.CONCERN,
                    entityId: concern.id,
                    action: AuditAction.CREATED,
                    metadata: { childId: dto.childId },
                });
                return concern;
            }
            catch (e) {
                this.handlePrismaError(e, "create");
            }
        });
    }
    async findAll(filters = {}, context) {
        return this.withContext(context, async (tx) => {
            const where = {
                child: { tenantId: context.tenantId },
                ...(filters.childId ? { childId: filters.childId } : {}),
                deletedAt: null,
            };
            const records = await tx.concern.findMany({
                where,
                orderBy: { createdAt: "desc" },
            });
            await this.audit.recordEvent({
                actorUserId: context.actorUserId,
                tenantId: context.tenantId,
                orgId: context.orgId,
                entityType: AuditEntityType.CONCERN,
                entityId: null,
                action: AuditAction.VIEWED,
                metadata: {
                    filterChildId: filters.childId ?? null,
                    resultCount: records.length,
                },
            });
            return records;
        });
    }
    async findOne(id, context) {
        return this.withContext(context, async (tx) => {
            const concern = await this.requireConcernForTenant(id, context.tenantId, tx);
            await this.audit.recordEvent({
                actorUserId: context.actorUserId,
                tenantId: context.tenantId,
                orgId: context.orgId,
                entityType: AuditEntityType.CONCERN,
                entityId: id,
                action: AuditAction.VIEWED,
                metadata: { childId: concern.childId },
            });
            return concern;
        });
    }
    async update(id, dto, context) {
        return this.withContext(context, async (tx) => {
            await this.requireConcernForTenant(id, context.tenantId, tx);
            try {
                const concern = await tx.concern.update({
                    where: { id },
                    data: {
                        summary: dto.summary ?? undefined,
                        details: dto.details ?? undefined,
                    },
                });
                await this.audit.recordEvent({
                    actorUserId: context.actorUserId,
                    tenantId: context.tenantId,
                    orgId: context.orgId,
                    entityType: AuditEntityType.CONCERN,
                    entityId: id,
                    action: AuditAction.UPDATED,
                    metadata: {
                        updatedFields: Object.keys(dto ?? {}),
                    },
                });
                return concern;
            }
            catch (e) {
                this.handlePrismaError(e, "update", id);
            }
        });
    }
    async remove(id, context) {
        return this.withContext(context, async (tx) => {
            const concern = await this.requireConcernForTenant(id, context.tenantId, tx);
            try {
                const deleted = await tx.concern.update({
                    where: { id },
                    data: { deletedAt: new Date() },
                });
                await this.audit.recordEvent({
                    actorUserId: context.actorUserId,
                    tenantId: context.tenantId,
                    orgId: context.orgId,
                    entityType: AuditEntityType.CONCERN,
                    entityId: id,
                    action: AuditAction.DELETED,
                    metadata: { childId: concern.childId },
                });
                return { id: deleted.id, deletedAt: deleted.deletedAt };
            }
            catch (e) {
                this.handlePrismaError(e, "delete", id);
            }
        });
    }
    async requireConcernForTenant(id, tenantId, tx) {
        const concern = await tx.concern.findFirst({
            where: {
                id,
                child: { tenantId },
                deletedAt: null,
            },
        });
        if (!concern)
            throw new NotFoundException("Concern not found");
        return concern;
    }
    withContext(context, callback) {
        return withTenantRlsContext(context.tenantId, context.orgId, async (tx) => {
            await tx.$executeRawUnsafe(`SELECT set_config('app.user_id', $1, true)`, context.actorUserId ?? "");
            return callback(tx);
        });
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
            throw new NotFoundException(id ? `Concern with id ${id} not found` : "Concern not found");
        }
        if (code === "P2003") {
            throw new BadRequestException(`Invalid reference for concern ${action}: ${message}`);
        }
        if (code === "P2002") {
            throw new BadRequestException(`Duplicate value violates a unique constraint: ${message}`);
        }
        throw new BadRequestException(`Failed to ${action} concern: ${message}`);
    }
};
ConcernsService = __decorate([
    Injectable(),
    __param(0, Inject(AuditService)),
    __metadata("design:paramtypes", [AuditService])
], ConcernsService);
export { ConcernsService };
