import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  BadRequestException,
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

@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get()
  async list() {
    return this.attendanceService.list();
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    return this.attendanceService.getById(id);
  }

  @Post()
  async create(@Body() body: CreateAttendanceDto) {
    const parsed = createAttendanceDto.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.format());
    }
    return this.attendanceService.create(parsed.data);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: UpdateAttendanceDto) {
    const parsed = updateAttendanceDto.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.format());
    }
    return this.attendanceService.update(id, parsed.data);
  }
}
