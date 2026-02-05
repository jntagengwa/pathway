import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
  Inject,
} from "@nestjs/common";
import type { Response } from "express";
import { z, ZodError } from "zod";
import { LessonsService } from "./lessons.service";
import { createLessonDto, updateLessonDto } from "./dto";
import { CurrentTenant } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";

// Simple UUID validator for path params
const idParam = z
  .string({ required_error: "id is required" })
  .uuid("id must be a valid uuid");

// Optional filters for list
// TODO(Epic1-Task1.3): once PathwayRequestContext is globally enforced, drop the tenantId query param
// and rely on @CurrentTenant() to keep handlers multi-tenant safe by default.
const listQuery = z
  .object({
    groupId: z.string().uuid().optional(),
    weekOf: z.coerce.date().optional(),
  })
  .strict();

@UseGuards(AuthUserGuard)
@Controller("lessons")
export class LessonsController {
  constructor(@Inject(LessonsService) private readonly lessons: LessonsService) {}

  @Post()
  async create(
    @Body() body: unknown,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    try {
      const dto = await createLessonDto.parseAsync(body);
      if (dto.tenantId !== tenantId) {
        throw new BadRequestException("tenantId must match current tenant");
      }
      return await this.lessons.create(dto, tenantId);
    } catch (e) {
      if (e instanceof ZodError) throw new BadRequestException(e.errors);
      throw e;
    }
  }

  @Get()
  async findAll(
    @Query() query: Record<string, unknown>,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    try {
      const filters = await listQuery.parseAsync(query);
      return await this.lessons.findAll({ ...filters, tenantId });
    } catch (e) {
      if (e instanceof ZodError) throw new BadRequestException(e.errors);
      throw e;
    }
  }

  @Get(":id/resource")
  async getResource(
    @Param("id") idRaw: string,
    @CurrentTenant("tenantId") tenantId: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    try {
      const id = idParam.parse(idRaw);
      const file = await this.lessons.getResourceFile(id, tenantId);
      if (!file) {
        res.status(404).json({
          message: "No resource file for this lesson",
          error: "Not Found",
          statusCode: 404,
        });
        return;
      }
      const safeName = file.fileName.replace(/[^\w.-]/g, "_");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeName}"`,
      );
      res.setHeader("Content-Type", "application/octet-stream");
      res.send(file.buffer);
    } catch (e) {
      if (e instanceof ZodError) throw new BadRequestException(e.errors);
      throw e;
    }
  }

  @Get(":id")
  async findOne(
    @Param("id") idRaw: string,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    try {
      const id = idParam.parse(idRaw);
      return await this.lessons.findOne(id, tenantId);
    } catch (e) {
      if (e instanceof ZodError) throw new BadRequestException(e.errors);
      throw e;
    }
  }

  @Patch(":id")
  async update(
    @Param("id") idRaw: string,
    @Body() body: unknown,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    try {
      const id = idParam.parse(idRaw);
      const dto = await updateLessonDto.parseAsync(body);
      return await this.lessons.update(id, dto, tenantId);
    } catch (e) {
      if (e instanceof ZodError) throw new BadRequestException(e.errors);
      throw e;
    }
  }

  @Delete(":id")
  async remove(
    @Param("id") idRaw: string,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    try {
      const id = idParam.parse(idRaw);
      return await this.lessons.remove(id, tenantId);
    } catch (e) {
      if (e instanceof ZodError) throw new BadRequestException(e.errors);
      throw e;
    }
  }
}
