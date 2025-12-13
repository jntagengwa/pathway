import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { z } from "zod";
import { AnnouncementsService, type Audience } from "./announcements.service";
import { createAnnouncementDto, updateAnnouncementDto } from "./dto";
import { CurrentTenant, PathwayAuthGuard, CurrentOrg } from "@pathway/auth";
import { EntitlementsEnforcementService } from "../billing/entitlements-enforcement.service";

const listQuery = z
  .object({
    audience: z.enum(["ALL", "PARENTS", "STAFF"]).optional(),
    publishedOnly: z.coerce.boolean().optional(),
  })
  .strict();

const idParam = z.object({ id: z.string().uuid("id must be a valid UUID") });

@UseGuards(PathwayAuthGuard)
@Controller("announcements")
export class AnnouncementsController {
  constructor(
    private readonly service: AnnouncementsService,
    private readonly enforcement: EntitlementsEnforcementService,
  ) {}

  @Post()
  async create(
    @Body() body: unknown,
    @CurrentTenant("tenantId") tenantId: string,
    @CurrentOrg("orgId") orgId: string,
  ) {
    // Service will validate again, but we parse here to provide immediate 400s with clear messages
    const dto = await createAnnouncementDto.parseAsync(body);
    if (dto.tenantId !== tenantId) {
      throw new BadRequestException("tenantId must match current tenant");
    }
    const av30 = await this.enforcement.checkAv30ForOrg(orgId);
    this.enforcement.assertWithinHardCap(av30);
    // TODO(Epic4-UI): Surface av30 status in response metadata for warnings
    return this.service.create(dto, tenantId);
  }

  @Get()
  async findAll(
    @Query() query: unknown,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    const q = await listQuery.parseAsync(query);
    return this.service.findAll({
      tenantId,
      audience: q.audience as Audience | undefined,
      publishedOnly: q.publishedOnly ?? false,
    });
  }

  @Get(":id")
  async findOne(
    @Param() params: unknown,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    const { id } = await idParam.parseAsync(params);
    return this.service.findOne(id, tenantId);
  }

  @Patch(":id")
  async update(
    @Param() params: unknown,
    @Body() body: unknown,
    @CurrentTenant("tenantId") tenantId: string,
    @CurrentOrg("orgId") orgId: string,
  ) {
    const { id } = await idParam.parseAsync(params);
    const dto = await updateAnnouncementDto.parseAsync(body);
    // If publish-on-update, enforce AV30 hard cap; otherwise no-op
    if (dto.publishedAt) {
      const av30 = await this.enforcement.checkAv30ForOrg(orgId);
      this.enforcement.assertWithinHardCap(av30);
      // TODO(Epic4-UI): Surface av30 status in response metadata for warnings
    }
    return this.service.update(id, dto, tenantId);
  }

  @Delete(":id")
  async remove(
    @Param() params: unknown,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    const { id } = await idParam.parseAsync(params);
    return this.service.remove(id, tenantId);
  }
}
