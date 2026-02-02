import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  NotFoundException,
  BadRequestException,
  UseGuards,
  Inject,
} from "@nestjs/common";
import { z } from "zod";
import { CurrentTenant, CurrentOrg } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { StaffService } from "./staff.service";
import { updateStaffDto } from "./dto/update-staff.dto";

const forSessionAssignmentQuery = z.object({
  groupId: z.string().uuid().optional(),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
});

@UseGuards(AuthUserGuard)
@Controller("staff")
export class StaffController {
  constructor(@Inject(StaffService) private readonly staffService: StaffService) {}

  @Get("for-session-assignment")
  async getForSessionAssignment(
    @Query() query: unknown,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    if (!tenantId) {
      throw new BadRequestException("Active site context required");
    }
    const parsed = forSessionAssignmentQuery.safeParse(query);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    const { groupId, startsAt, endsAt } = parsed.data;
    return this.staffService.getStaffForSessionAssignment(tenantId, {
      groupId: groupId ?? null,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
    });
  }

  @Get(":userId")
  async getById(
    @Param("userId") userId: string,
    @CurrentTenant("tenantId") tenantId: string,
    @CurrentOrg("orgId") orgId: string,
  ) {
    if (!tenantId || !orgId) {
      throw new BadRequestException("Active site context required");
    }
    try {
      return await this.staffService.getById(userId, tenantId, orgId);
    } catch (e) {
      if (e instanceof NotFoundException) throw e;
      throw e;
    }
  }

  @Patch(":userId")
  async update(
    @Param("userId") userId: string,
    @Body() body: unknown,
    @CurrentTenant("tenantId") tenantId: string,
    @CurrentOrg("orgId") orgId: string,
  ) {
    if (!tenantId || !orgId) {
      throw new BadRequestException("Active site context required");
    }
    const parsed = updateStaffDto.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return await this.staffService.update(userId, tenantId, orgId, parsed.data);
  }
}
