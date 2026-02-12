import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  BadRequestException,
  UnauthorizedException,
  UseGuards,
  Inject,
  Res,
  Header,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { ExportsService, AttendanceExportType } from "./exports.service";
import { CurrentTenant } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";

interface AuthenticatedRequest extends Request {
  authUserId?: string;
}

function parseDateOrThrow(label: string, value?: string): Date {
  if (value == null) throw new BadRequestException(`${label} is required`);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new BadRequestException(`${label} must be a valid ISO date (YYYY-MM-DD)`);
  }
  return d;
}

function defaultDateRange(): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return { from, to };
}

@Controller("exports")
@UseGuards(AuthUserGuard)
export class ExportsController {
  constructor(@Inject(ExportsService) private readonly exportsService: ExportsService) {}

  @Get("attendance/site")
  @Header("Content-Type", "text/csv; charset=utf-8")
  async getSiteAttendanceCsv(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Query("from") fromQ?: string,
    @Query("to") toQ?: string,
    @Query("type") typeQ?: string,
    @CurrentTenant("tenantId") tenantId?: string,
  ) {
    if (!tenantId) throw new UnauthorizedException("Tenant context required");
    const userId = req.authUserId;
    if (!userId) throw new UnauthorizedException("Authentication required");
    const { from, to } =
      fromQ && toQ
        ? { from: parseDateOrThrow("from", fromQ), to: parseDateOrThrow("to", toQ) }
        : defaultDateRange();
    const type = (typeQ === "children" || typeQ === "staff" ? typeQ : "all") as AttendanceExportType;

    const csv = await this.exportsService.getSiteAttendanceCsv(userId, tenantId, from, to, type);
    const filename = `nexsteps-attendance-site-${formatFilenameDate(from)}-${formatFilenameDate(to)}.csv`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get("attendance/child/:childId")
  @Header("Content-Type", "text/csv; charset=utf-8")
  async getChildAttendanceCsv(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Param("childId") childId: string,
    @Query("from") fromQ?: string,
    @Query("to") toQ?: string,
    @CurrentTenant("tenantId") tenantId?: string,
  ) {
    if (!tenantId) throw new UnauthorizedException("Tenant context required");
    const userId = req.authUserId;
    if (!userId) throw new UnauthorizedException("Authentication required");
    const { from, to } =
      fromQ && toQ
        ? { from: parseDateOrThrow("from", fromQ), to: parseDateOrThrow("to", toQ) }
        : defaultDateRange();

    const csv = await this.exportsService.getChildAttendanceCsv(userId, tenantId, childId, from, to);
    const filename = `nexsteps-attendance-child-${childId}-${formatFilenameDate(from)}-${formatFilenameDate(to)}.csv`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get("attendance/staff/:userId")
  @Header("Content-Type", "text/csv; charset=utf-8")
  async getStaffAttendanceCsv(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
    @Param("userId") staffUserId: string,
    @Query("from") fromQ?: string,
    @Query("to") toQ?: string,
    @CurrentTenant("tenantId") tenantId?: string,
  ) {
    if (!tenantId) throw new UnauthorizedException("Tenant context required");
    const userId = req.authUserId;
    if (!userId) throw new UnauthorizedException("Authentication required");
    const { from, to } =
      fromQ && toQ
        ? { from: parseDateOrThrow("from", fromQ), to: parseDateOrThrow("to", toQ) }
        : defaultDateRange();

    const csv = await this.exportsService.getStaffAttendanceCsv(userId, tenantId, staffUserId, from, to);
    const filename = `nexsteps-attendance-staff-${staffUserId}-${formatFilenameDate(from)}-${formatFilenameDate(to)}.csv`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  }
}

function formatFilenameDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}
