import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { prisma, Prisma, Role, AssignmentStatus } from "@pathway/db";
import { CreateAssignmentDto } from "./dto/create-assignment.dto";
import { UpdateAssignmentDto } from "./dto/update-assignment.dto";

@Injectable()
export class AssignmentsService {
  /**
   * Create an assignment. Relies on DB FKs and the unique index
   * (sessionId, userId, role) to enforce integrity.
   */
  async create(dto: CreateAssignmentDto) {
    try {
      return await prisma.assignment.create({
        data: {
          sessionId: dto.sessionId,
          userId: dto.userId,
          role: dto.role as Role,
          status: dto.status ?? AssignmentStatus.CONFIRMED,
        },
      });
    } catch (e) {
      this.handlePrismaError(e);
    }
  }

  /**
   * List assignments with optional filters.
   */
  async findAll(where: Prisma.AssignmentWhereInput = {}) {
    return prisma.assignment.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Get a single assignment by id.
   */
  async findOne(id: string) {
    const found = await prisma.assignment.findUnique({ where: { id } });
    if (!found) throw new NotFoundException("Assignment not found");
    return found;
  }

  /**
   * Update an assignment by id.
   */
  async update(id: string, dto: UpdateAssignmentDto) {
    try {
      return await prisma.assignment.update({
        where: { id },
        data: {
          // allow partial updates
          role: dto.role as Role | undefined,
          status: dto.status as AssignmentStatus | undefined,
        },
      });
    } catch (e) {
      this.handlePrismaError(e, id);
    }
  }

  /**
   * Delete an assignment by id.
   */
  async remove(id: string) {
    try {
      return await prisma.assignment.delete({ where: { id } });
    } catch (e) {
      this.handlePrismaError(e, id);
    }
  }

  private handlePrismaError(error: unknown, id?: string): never {
    if (error && typeof error === "object" && "code" in error) {
      const err = error as Prisma.PrismaClientKnownRequestError;
      // Unique constraint (sessionId, userId, role)
      if (err.code === "P2002") {
        throw new BadRequestException(
          "An assignment for this user, role and session already exists",
        );
      }
      // Foreign key violation
      if (err.code === "P2003") {
        throw new BadRequestException(
          "Invalid foreign key: sessionId or userId",
        );
      }
      // Record to update/delete not found
      if (err.code === "P2025") {
        throw new NotFoundException(
          id ? `Assignment ${id} not found` : "Assignment not found",
        );
      }
    }
    throw new BadRequestException("Unable to process assignment operation");
  }
}
