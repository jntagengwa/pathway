import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  BadRequestException,
} from "@nestjs/common";
import { ChildrenService } from "./children.service";
import { createChildDto, CreateChildDto } from "./dto/create-child.dto";
import { updateChildDto, UpdateChildDto } from "./dto/update-child.dto";

@Controller("children")
export class ChildrenController {
  constructor(private readonly childrenService: ChildrenService) {}

  @Get()
  async list() {
    return this.childrenService.list();
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    return this.childrenService.getById(id);
  }

  @Post()
  async create(@Body() body: unknown) {
    const parsed = createChildDto.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.format());
    }
    return this.childrenService.create(parsed.data as CreateChildDto);
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: unknown) {
    const parsed = updateChildDto.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.format());
    }
    return this.childrenService.update(id, parsed.data as UpdateChildDto);
  }
}
