import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  NotFoundException,
  Patch,
  BadRequestException,
} from "@nestjs/common";
import { GroupsService } from "./groups.service";
import { createGroupDto, type CreateGroupDto } from "./dto/create-group.dto";
import { updateGroupDto, type UpdateGroupDto } from "./dto/update-group.dto";

@Controller("groups")
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async list() {
    return this.groupsService.list();
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    const group = await this.groupsService.getById(id);
    if (!group) throw new NotFoundException("Group not found");
    return group;
  }

  @Post()
  async create(@Body() dto: CreateGroupDto) {
    // Let the service handle normalization/validation; optional quick parse here for early 400s
    const parsed = createGroupDto.safeParse(dto);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.groupsService.create(parsed.data);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateGroupDto) {
    const parsed = updateGroupDto.safeParse(dto);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.errors);
    }
    return this.groupsService.update(id, parsed.data);
  }
}
