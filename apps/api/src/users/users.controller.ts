import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  NotFoundException,
  BadRequestException,
  UseGuards,
} from "@nestjs/common";
import { CurrentTenant, PathwayAuthGuard } from "@pathway/auth";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@UseGuards(PathwayAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async list(@CurrentTenant("tenantId") tenantId: string) {
    return this.usersService.list(tenantId);
  }

  @Get(":id")
  async getById(
    @Param("id") id: string,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    const user = await this.usersService.getById(id, tenantId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  @Post()
  async create(
    @Body() dto: CreateUserDto,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    if (dto.tenantId && dto.tenantId !== tenantId) {
      throw new BadRequestException("tenantId must match current tenant");
    }
    return this.usersService.create({ ...dto, tenantId });
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    if (dto.tenantId && dto.tenantId !== tenantId) {
      throw new BadRequestException("tenantId must match current tenant");
    }
    return this.usersService.update(id, { ...dto, tenantId });
  }
}
