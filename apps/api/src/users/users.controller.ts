import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  NotFoundException,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async list() {
    return this.usersService.list();
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    const user = await this.usersService.getById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }
}
