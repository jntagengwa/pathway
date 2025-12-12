import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import { AttendanceService } from "./attendance.service";
import {
  createAttendanceDto,
  CreateAttendanceDto,
} from "./dto/create-attendance.dto";
import {
  updateAttendanceDto,
  UpdateAttendanceDto,
} from "./dto/update-attendance.dto";
import { CurrentTenant, PathwayAuthGuard } from "@pathway/auth";

@UseGuards(PathwayAuthGuard)
@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  async list(@CurrentTenant("tenantId") tenantId: string) {
    return this.attendanceService.list(tenantId);
  }

  @Get(":id")
  async getById(
    @Param("id") id: string,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    return this.attendanceService.getById(id, tenantId);
  }

  @Post()
  async create(
    @Body() body: CreateAttendanceDto,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    const parsed = createAttendanceDto.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.format());
    }
    return this.attendanceService.create(parsed.data, tenantId);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() body: UpdateAttendanceDto,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    const parsed = updateAttendanceDto.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.format());
    }
    return this.attendanceService.update(id, parsed.data, tenantId);
  }
}
