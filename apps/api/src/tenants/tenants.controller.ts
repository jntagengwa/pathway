import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  BadRequestException,
} from "@nestjs/common";
import { TenantsService } from "./tenants.service";
import { createTenantDto } from "./dto/create-tenant.dto";
import type { CreateTenantDto } from "./dto/create-tenant.dto";

@Controller("tenants")
export class TenantsController {
  constructor(private readonly svc: TenantsService) {}

  @Get()
  async list() {
    return this.svc.list();
  }

  @Get(":slug")
  async bySlug(@Param("slug") slug: string) {
    return this.svc.getBySlug(slug);
  }

  @Post()
  async create(@Body() body: CreateTenantDto) {
    const result = createTenantDto.safeParse(body);
    if (!result.success) {
      throw new BadRequestException(result.error.format());
    }
    return this.svc.create(result.data);
  }
}
