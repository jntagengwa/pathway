import { Controller, Get, Param, Post, Body } from "@nestjs/common";
import { TenantsService } from "./tenants.service";
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
    return this.svc.create(body);
  }
}
