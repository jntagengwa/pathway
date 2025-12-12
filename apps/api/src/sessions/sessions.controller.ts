import {
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Body,
  Query,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import { SessionsService, SessionListFilters } from "./sessions.service";
import { CreateSessionDto } from "./dto/create-session.dto";
import { UpdateSessionDto } from "./dto/update-session.dto";
import { CurrentTenant, PathwayAuthGuard } from "@pathway/auth";

type IsoDateString = string; // ISO 8601 expected

interface SessionsQuery {
  groupId?: string;
  from?: IsoDateString;
  to?: IsoDateString;
}

function parseDateOrThrow(label: string, value?: string): Date | undefined {
  if (value == null) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(`${label} must be a valid ISO date`);
  }
  return d;
}

@Controller("sessions")
export class SessionsController {
  constructor(private readonly svc: SessionsService) {}

  @Get()
  @UseGuards(PathwayAuthGuard)
  async list(
    @Query() q: SessionsQuery,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    const filters: SessionListFilters = {
      tenantId,
      groupId: q.groupId,
      from: parseDateOrThrow("from", q.from),
      to: parseDateOrThrow("to", q.to),
    };
    return this.svc.list(filters);
  }

  @Get(":id")
  @UseGuards(PathwayAuthGuard)
  async getById(
    @Param("id") id: string,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    return this.svc.getById(id, tenantId);
  }

  @Post()
  @UseGuards(PathwayAuthGuard)
  async create(
    @Body() dto: CreateSessionDto,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    if (
      dto.startsAt &&
      dto.endsAt &&
      new Date(dto.endsAt) <= new Date(dto.startsAt)
    ) {
      throw new BadRequestException("endsAt must be after startsAt");
    }
    if (dto.tenantId && dto.tenantId !== tenantId) {
      throw new BadRequestException("tenantId must match current tenant");
    }
    return this.svc.create({ ...dto, tenantId }, tenantId);
  }

  @Patch(":id")
  @UseGuards(PathwayAuthGuard)
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateSessionDto,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    if (
      dto.startsAt &&
      dto.endsAt &&
      new Date(dto.endsAt) <= new Date(dto.startsAt)
    ) {
      throw new BadRequestException("endsAt must be after startsAt");
    }
    if (dto.tenantId && dto.tenantId !== tenantId) {
      throw new BadRequestException("tenantId must match current tenant");
    }
    return this.svc.update(id, dto, tenantId);
  }

  @Delete(":id")
  @UseGuards(PathwayAuthGuard)
  async delete(
    @Param("id") id: string,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    return this.svc.delete(id, tenantId);
  }
}
