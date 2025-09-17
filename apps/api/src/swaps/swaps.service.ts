import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { prisma, SwapStatus } from "@pathway/db";
import { CreateSwapDto, UpdateSwapDto } from "./dto";

@Injectable()
export class SwapsService {
  /**
   * Create a swap request. Validates related records exist and basic invariants.
   */
  async create(dto: CreateSwapDto) {
    // Basic invariant: ACCEPTED swaps must specify a target user
    if (dto.status === SwapStatus.ACCEPTED && !dto.toUserId) {
      throw new BadRequestException(
        "toUserId is required when status is ACCEPTED",
      );
    }

    // Validate foreign keys
    const [assignment, fromUser, toUser] = await Promise.all([
      prisma.assignment.findUnique({
        where: { id: dto.assignmentId },
        select: { id: true },
      }),
      prisma.user.findUnique({
        where: { id: dto.fromUserId },
        select: { id: true },
      }),
      dto.toUserId
        ? prisma.user.findUnique({
            where: { id: dto.toUserId },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    if (!assignment) throw new NotFoundException("Assignment not found");
    if (!fromUser) throw new NotFoundException("fromUser not found");
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
  async findAll(filter?: {
    assignmentId?: string;
    fromUserId?: string;
    toUserId?: string;
    status?: SwapStatus;
  }) {
    return prisma.swapRequest.findMany({
      where: {
        assignmentId: filter?.assignmentId,
        fromUserId: filter?.fromUserId,
        toUserId: filter?.toUserId,
        status: filter?.status,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get one swap request by id.
   */
  async findOne(id: string) {
    const found = await prisma.swapRequest.findUnique({ where: { id } });
    if (!found) throw new NotFoundException("SwapRequest not found");
    return found;
  }

  /**
   * Update a swap request.
   */
  async update(id: string, dto: UpdateSwapDto) {
    const existing = await prisma.swapRequest.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("SwapRequest not found");

    // If status transitions to ACCEPTED, ensure we have a toUserId either incoming or existing
    const nextToUserId = dto.toUserId ?? existing.toUserId ?? null;
    if (dto.status === SwapStatus.ACCEPTED && !nextToUserId) {
      throw new BadRequestException(
        "toUserId is required when status is ACCEPTED",
      );
    }

    if (dto.toUserId) {
      const toUser = await prisma.user.findUnique({
        where: { id: dto.toUserId },
      });
      if (!toUser) throw new NotFoundException("toUser not found");
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
  async remove(id: string) {
    return prisma.swapRequest.delete({ where: { id } });
  }
}
