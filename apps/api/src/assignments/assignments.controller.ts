import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { AssignmentsService } from "./assignments.service";
import { z } from "zod";
import {
  createAssignmentDto,
  type CreateAssignmentDto,
} from "./dto/create-assignment.dto";
import {
  updateAssignmentDto,
  type UpdateAssignmentDto,
} from "./dto/update-assignment.dto";
import { AssignmentStatus, Role } from "@pathway/db";
import { CurrentTenant, PathwayAuthGuard } from "@pathway/auth";
import { UseGuards } from "@nestjs/common";

@UseGuards(PathwayAuthGuard)
@Controller("assignments")
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  async create(
    @Body() body: unknown,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    const dto: CreateAssignmentDto = createAssignmentDto.parse(body);
    return this.assignmentsService.create(dto, tenantId);
  }

  @Get()
  async findAll(
    @Query()
    query: Record<string, unknown>,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    const querySchema = z.object({
      sessionId: z.string().uuid().optional(),
      userId: z.string().uuid().optional(),
      role: z.nativeEnum(Role).optional(),
      status: z.nativeEnum(AssignmentStatus).optional(),
    });

    const filters = querySchema.parse(query);

    return this.assignmentsService.findAll({
      tenantId,
      ...(filters.sessionId ? { sessionId: filters.sessionId } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.role ? { role: filters.role } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    });
  }

  @Get(":id")
  async findOne(
    @Param("id") id: string,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    // validate id format
    z.string().uuid().parse(id);
    return this.assignmentsService.findOne(id, tenantId);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() body: unknown,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    z.string().uuid().parse(id);
    const dto: UpdateAssignmentDto = updateAssignmentDto.parse(body);
    return this.assignmentsService.update(id, dto, tenantId);
  }

  @Delete(":id")
  async remove(
    @Param("id") id: string,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    z.string().uuid().parse(id);
    await this.assignmentsService.remove(id, tenantId);
    return { id, deleted: true };
  }
}
