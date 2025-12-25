import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  NotFoundException,
  Patch,
  BadRequestException,
  UseGuards,
  Inject,
} from "@nestjs/common";
import { CurrentTenant } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { GroupsService } from "./groups.service";
import { createGroupDto, type CreateGroupDto } from "./dto/create-group.dto";
import { updateGroupDto, type UpdateGroupDto } from "./dto/update-group.dto";

@UseGuards(AuthUserGuard)
@Controller("groups")
export class GroupsController {
  constructor(@Inject(GroupsService) private readonly groupsService: GroupsService) {}

  @Get()
  async list(@CurrentTenant("tenantId") tenantId: string) {
    return this.groupsService.list(tenantId);
  }

  @Get(":id")
  async getById(
    @Param("id") id: string,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    const group = await this.groupsService.getById(id, tenantId);
    if (!group) throw new NotFoundException("Group not found");
    return group;
  }

  @Post()
  async create(
    @Body() dto: CreateGroupDto,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    // Let the service handle normalization/validation; optional quick parse here for early 400s
    const parsed = createGroupDto.safeParse(dto);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    if (parsed.data.tenantId !== tenantId) {
      throw new BadRequestException("tenantId must match current tenant");
    }
    return this.groupsService.create({ ...parsed.data, tenantId }, tenantId);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateGroupDto,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    const parsed = updateGroupDto.safeParse(dto);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.groupsService.update(id, parsed.data, tenantId);
  }
}
