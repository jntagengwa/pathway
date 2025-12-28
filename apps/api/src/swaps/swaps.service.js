var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, BadRequestException, NotFoundException, } from "@nestjs/common";
import { prisma, SwapStatus } from "@pathway/db";
let SwapsService = class SwapsService {
    /**
     * Create a swap request. Validates related records exist and basic invariants.
     */
    async create(dto, tenantId) {
        // Basic invariant: ACCEPTED swaps must specify a target user
        if (dto.status === SwapStatus.ACCEPTED && !dto.toUserId) {
            throw new BadRequestException("toUserId is required when status is ACCEPTED");
        }
        // Validate foreign keys
        const [assignment, fromUser, toUser] = await Promise.all([
            prisma.assignment.findFirst({
                where: { id: dto.assignmentId, session: { tenantId } },
                select: { id: true },
            }),
            prisma.user.findFirst({
                where: { id: dto.fromUserId, tenantId },
                select: { id: true },
            }),
            dto.toUserId
                ? prisma.user.findFirst({
                    where: { id: dto.toUserId, tenantId },
                    select: { id: true },
                })
                : Promise.resolve(null),
        ]);
        if (!assignment)
            throw new NotFoundException("Assignment not found");
        if (!fromUser)
            throw new NotFoundException("fromUser not found");
        if (dto.toUserId && !toUser)
            throw new NotFoundException("toUser not found");
        return prisma.swapRequest.create({
            data: {
                assignmentId: dto.assignmentId,
                fromUserId: dto.fromUserId,
                toUserId: dto.toUserId ?? null,
                status: dto.status ?? SwapStatus.REQUESTED,
            },
        });
    }
    /**
     * List swap requests with optional filters.
     */
    async findAll(filter) {
        return prisma.swapRequest.findMany({
            where: {
                assignmentId: filter?.assignmentId,
                fromUserId: filter?.fromUserId,
                toUserId: filter?.toUserId,
                status: filter?.status,
                assignment: { session: { tenantId: filter.tenantId } },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    /**
     * Get one swap request by id.
     */
    async findOne(id, tenantId) {
        const found = await prisma.swapRequest.findFirst({
            where: { id, assignment: { session: { tenantId } } },
        });
        if (!found)
            throw new NotFoundException("SwapRequest not found");
        return found;
    }
    /**
     * Update a swap request.
     */
    async update(id, dto, tenantId) {
        const existing = await prisma.swapRequest.findFirst({
            where: { id, assignment: { session: { tenantId } } },
        });
        if (!existing)
            throw new NotFoundException("SwapRequest not found");
        // If status transitions to ACCEPTED, ensure we have a toUserId either incoming or existing
        const nextToUserId = dto.toUserId ?? existing.toUserId ?? null;
        if (dto.status === SwapStatus.ACCEPTED && !nextToUserId) {
            throw new BadRequestException("toUserId is required when status is ACCEPTED");
        }
        if (dto.toUserId) {
            const toUser = await prisma.user.findFirst({
                where: { id: dto.toUserId, tenantId },
            });
            if (!toUser)
                throw new NotFoundException("toUser not found");
        }
        return prisma.swapRequest.update({
            where: { id },
            data: {
                toUserId: dto.toUserId !== undefined ? dto.toUserId : undefined,
                status: dto.status !== undefined ? dto.status : undefined,
            },
        });
    }
    /**
     * Delete a swap request.
     */
    async remove(id, tenantId) {
        const existing = await prisma.swapRequest.findFirst({
            where: { id, assignment: { session: { tenantId } } },
        });
        if (!existing)
            throw new NotFoundException("SwapRequest not found");
        await prisma.swapRequest.deleteMany({
            where: { id, assignment: { session: { tenantId } } },
        });
        return existing;
    }
};
SwapsService = __decorate([
    Injectable()
], SwapsService);
export { SwapsService };
