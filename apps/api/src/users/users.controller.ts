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
  Inject,
} from "@nestjs/common";
import { CurrentTenant } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@UseGuards(AuthUserGuard)
@Controller("users")
export class UsersController {
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

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
