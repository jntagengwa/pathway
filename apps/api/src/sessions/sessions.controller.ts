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
} from "@nestjs/common";
import { SessionsService, SessionListFilters } from "./sessions.service";
import { CreateSessionDto } from "./dto/create-session.dto";
import { UpdateSessionDto } from "./dto/update-session.dto";

type IsoDateString = string; // ISO 8601 expected

interface SessionsQuery {
  tenantId?: string;
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
  async list(@Query() q: SessionsQuery) {
    const filters: SessionListFilters = {
      tenantId: q.tenantId,
      groupId: q.groupId,
      from: parseDateOrThrow("from", q.from),
      to: parseDateOrThrow("to", q.to),
    };
    return this.svc.list(filters);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    return this.svc.getById(id);
  }

  @Post()
  async create(@Body() dto: CreateSessionDto) {
    if (
      dto.startsAt &&
      dto.endsAt &&
      new Date(dto.endsAt) <= new Date(dto.startsAt)
    ) {
      throw new BadRequestException("endsAt must be after startsAt");
    }
    return this.svc.create(dto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateSessionDto) {
    if (
      dto.startsAt &&
      dto.endsAt &&
      new Date(dto.endsAt) <= new Date(dto.startsAt)
    ) {
      throw new BadRequestException("endsAt must be after startsAt");
    }
    return this.svc.update(id, dto);
  }

  @Delete(":id")
  async delete(@Param("id") id: string) {
    return this.svc.delete(id);
  }
}
