import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from "@nestjs/common";
import { z } from "zod";
import { AnnouncementsService, type Audience } from "./announcements.service";
import { createAnnouncementDto, updateAnnouncementDto } from "./dto";

const listQuery = z
  .object({
    tenantId: z.string().uuid().optional(),
    audience: z.enum(["ALL", "PARENTS", "STAFF"]).optional(),
    publishedOnly: z.coerce.boolean().optional(),
  })
  .strict();

const idParam = z.object({ id: z.string().uuid("id must be a valid UUID") });

@Controller("announcements")
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Post()
  async create(@Body() body: unknown) {
    // Service will validate again, but we parse here to provide immediate 400s with clear messages
    const dto = await createAnnouncementDto.parseAsync(body);
    return this.service.create(dto);
  }

  @Get()
  async findAll(@Query() query: unknown) {
    const q = await listQuery.parseAsync(query);
    return this.service.findAll({
      tenantId: q.tenantId,
      audience: q.audience as Audience | undefined,
      publishedOnly: q.publishedOnly ?? false,
    });
  }

  @Get(":id")
  async findOne(@Param() params: unknown) {
    const { id } = await idParam.parseAsync(params);
    return this.service.findOne(id);
  }

  @Patch(":id")
  async update(@Param() params: unknown, @Body() body: unknown) {
    const { id } = await idParam.parseAsync(params);
    const dto = await updateAnnouncementDto.parseAsync(body);
    return this.service.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param() params: unknown) {
    const { id } = await idParam.parseAsync(params);
    return this.service.remove(id);
  }
}
