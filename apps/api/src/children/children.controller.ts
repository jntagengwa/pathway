import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  BadRequestException,
  UseGuards,
  Inject,
} from "@nestjs/common";
import { CurrentTenant } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { ChildrenService } from "./children.service";
import { createChildSchema, CreateChildDto } from "./dto/create-child.dto";
import { UpdateChildDto, updateChildSchema } from "./dto/update-child.dto";

@Controller("children")
@UseGuards(AuthUserGuard)
export class ChildrenController {
  constructor(@Inject(ChildrenService) private readonly childrenService: ChildrenService) {}

  @Get()
  async list(@CurrentTenant("tenantId") tenantId: string) {
    return this.childrenService.list(tenantId);
  }

  @Get(":id")
  async getById(
    @Param("id") id: string,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    return this.childrenService.getById(id, tenantId);
  }

  @Post()
  async create(
    @Body() body: unknown,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    const parsed = createChildSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.format());
    }
    return this.childrenService.create(parsed.data as CreateChildDto, tenantId);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() body: unknown,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    const parsed = updateChildSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.format());
    }
    return this.childrenService.update(
      id,
      parsed.data as UpdateChildDto,
      tenantId,
    );
  }
}
