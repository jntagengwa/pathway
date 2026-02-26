import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from "@nestjs/common";
import { AuthUserGuard } from "../auth/auth-user.guard";
import type { HandoverAuthenticatedRequest } from "./handover.auth";
import { assertTenantAdmin, getAuthUserId } from "./handover.auth";
import { Inject } from "@nestjs/common";
import { CurrentTenant } from "@pathway/auth";
import { HandoverService } from "./handover.service";
import {
  handoverAdminListQueryDto,
  handoverApproveDto,
  handoverRejectDto,
} from "./dto";
import { Query } from "@nestjs/common";

@Controller("admin/handover")
@UseGuards(AuthUserGuard)
export class HandoverAdminController {
  constructor(
    @Inject(HandoverService) private readonly service: HandoverService,
  ) {}

  @Get()
  async listAll(
    @Query() query: unknown,
    @CurrentTenant("tenantId") tenantId: string,
    @Req() req: HandoverAuthenticatedRequest,
  ) {
    assertTenantAdmin(req);
    const q = await handoverAdminListQueryDto.parseAsync(query);
    return this.service.listAdmin(tenantId, q);
  }

  @Get(":id")
  async getById(
    @Param("id") id: string,
    @Req() req: HandoverAuthenticatedRequest,
  ) {
    assertTenantAdmin(req);
    // Tenant is already enforced at service layer
    return this.service.getAdminById(id, req.__pathwayContext?.tenant?.tenantId ?? "");
  }

  @Post()
  async create(
    @Body() body: unknown,
    @Req() req: HandoverAuthenticatedRequest,
  ) {
    assertTenantAdmin(req);
    void body;
    // Placeholder: return 501-ish marker; real creation to follow in later steps.
    return { status: 501, message: "Not implemented" };
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() body: unknown,
    @Req() req: HandoverAuthenticatedRequest,
  ) {
    assertTenantAdmin(req);
    void body;
    return { id, status: 501, message: "Not implemented" };
  }

  @Post(":id/approve")
  async approve(
    @Param("id") id: string,
    @Body() body: unknown,
    @CurrentTenant("tenantId") tenantId: string,
    @Req() req: HandoverAuthenticatedRequest,
  ) {
    assertTenantAdmin(req);
    const userId = getAuthUserId(req);
    const dto = await handoverApproveDto.parseAsync(body);
    return this.service.approveLog(id, tenantId, userId, dto);
  }

  @Get(":id/versions")
  async listVersions(
    @Param("id") id: string,
    @CurrentTenant("tenantId") tenantId: string,
    @Req() req: HandoverAuthenticatedRequest,
  ) {
    assertTenantAdmin(req);
    return this.service.listVersionsAdmin(id, tenantId);
  }

  @Post(":id/reject")
  async reject(
    @Param("id") id: string,
    @Body() body: unknown,
    @CurrentTenant("tenantId") tenantId: string,
    @Req() req: HandoverAuthenticatedRequest,
  ) {
    assertTenantAdmin(req);
    const dto = await handoverRejectDto.parseAsync(body);
    const userId = getAuthUserId(req);
    return this.service.rejectLog(id, tenantId, userId, dto);
  }
}

