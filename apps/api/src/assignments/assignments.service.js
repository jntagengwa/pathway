var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable, BadRequestException, NotFoundException, } from "@nestjs/common";
import { prisma, AssignmentStatus } from "@pathway/db";
import { PathwayRequestContext } from "@pathway/auth";
import { Av30ActivityType } from "@pathway/types/av30";
import { Av30ActivityService } from "../av30/av30-activity.service";
let AssignmentsService = class AssignmentsService {
    av30ActivityService;
    requestContext;
    constructor(av30ActivityService, requestContext) {
        this.av30ActivityService = av30ActivityService;
        this.requestContext = requestContext;
    }
    /**
     * Create an assignment. Relies on DB FKs and the unique index
     * (sessionId, userId, role) to enforce integrity.
     */
    async create(dto, tenantId) {
        const session = await prisma.session.findUnique({
            where: { id: dto.sessionId },
            select: { id: true, tenantId: true },
        });
        if (!session || session.tenantId !== tenantId)
            throw new NotFoundException("Assignment not found");
        const user = await prisma.user.findUnique({
            where: { id: dto.userId },
            select: { id: true, tenantId: true },
        });
        if (!user || user.tenantId !== tenantId)
            throw new NotFoundException("Assignment not found");
        try {
            const created = await prisma.assignment.create({
                data: {
                    sessionId: dto.sessionId,
                    userId: dto.userId,
                    role: dto.role,
                    status: dto.status ?? AssignmentStatus.CONFIRMED,
                },
            });
            // Record AV30 activity: staff user was scheduled (assignment published)
            await this.av30ActivityService
                .recordActivity(this.requestContext, {
                activityType: Av30ActivityType.ASSIGNMENT_PUBLISHED,
                staffUserId: dto.userId,
            })
                .catch((err) => {
                // Log but don't fail the assignment creation if AV30 recording fails
                console.error("Failed to record AV30 activity for assignment creation", err);
            });
            return created;
        }
        catch (e) {
            this.handlePrismaError(e);
        }
    }
    /**
     * List assignments with optional filters.
     */
    async findAll(where) {
        const { tenantId, ...rest } = where;
        return prisma.assignment.findMany({
            where: {
                ...rest,
                session: { tenantId },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    /**
     * Get a single assignment by id.
     */
    async findOne(id, tenantId) {
        const found = await prisma.assignment.findFirst({
            where: { id, session: { tenantId } },
        });
        if (!found)
            throw new NotFoundException("Assignment not found");
        return found;
    }
    /**
     * Update an assignment by id.
     */
    async update(id, dto, tenantId) {
        const existing = await prisma.assignment.findFirst({
            where: { id, session: { tenantId } },
            select: { id: true, userId: true, status: true },
        });
        if (!existing)
            throw new NotFoundException("Assignment not found");
        try {
            const updated = await prisma.assignment.update({
                where: { id },
                data: {
                    // allow partial updates
                    role: dto.role,
                    status: dto.status,
                },
            });
            // Record AV30 activity if status changed to ACCEPTED or DECLINED
            if (dto.status && dto.status !== existing.status) {
                if (dto.status === AssignmentStatus.CONFIRMED) {
                    await this.av30ActivityService
                        .recordActivity(this.requestContext, {
                        activityType: Av30ActivityType.ASSIGNMENT_ACCEPTED,
                        staffUserId: existing.userId,
                    })
                        .catch((err) => {
                        console.error("Failed to record AV30 activity for assignment acceptance", err);
                    });
                }
                else if (dto.status === AssignmentStatus.DECLINED) {
                    await this.av30ActivityService
                        .recordActivity(this.requestContext, {
                        activityType: Av30ActivityType.ASSIGNMENT_DECLINED,
                        staffUserId: existing.userId,
                    })
                        .catch((err) => {
                        console.error("Failed to record AV30 activity for assignment decline", err);
                    });
                }
            }
            return updated;
        }
        catch (e) {
            this.handlePrismaError(e, id);
        }
    }
    /**
     * Delete an assignment by id.
     */
    async remove(id, tenantId) {
        const existing = await prisma.assignment.findFirst({
            where: { id, session: { tenantId } },
            select: { id: true },
        });
        if (!existing)
            throw new NotFoundException("Assignment not found");
        try {
            return await prisma.assignment.delete({ where: { id } });
        }
        catch (e) {
            this.handlePrismaError(e, id);
        }
    }
    handlePrismaError(error, id) {
        if (error && typeof error === "object" && "code" in error) {
            const err = error;
            // Unique constraint (sessionId, userId, role)
            if (err.code === "P2002") {
                throw new BadRequestException("An assignment for this user, role and session already exists");
            }
            // Foreign key violation
            if (err.code === "P2003") {
                throw new BadRequestException("Invalid foreign key: sessionId or userId");
            }
            // Record to update/delete not found
            if (err.code === "P2025") {
                throw new NotFoundException(id ? `Assignment ${id} not found` : "Assignment not found");
            }
        }
        throw new BadRequestException("Unable to process assignment operation");
    }
};
AssignmentsService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Av30ActivityService,
        PathwayRequestContext])
], AssignmentsService);
export { AssignmentsService };
