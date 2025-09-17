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
} from "@nestjs/common";
import { z, ZodError } from "zod";
import { LessonsService } from "./lessons.service";
import { createLessonDto, updateLessonDto } from "./dto";

// Simple UUID validator for path params
const idParam = z
  .string({ required_error: "id is required" })
  .uuid("id must be a valid uuid");

// Optional filters for list
const listQuery = z
  .object({
    tenantId: z.string().uuid().optional(),
    groupId: z.string().uuid().optional(),
    weekOf: z.coerce.date().optional(),
  })
  .strict();

@Controller("lessons")
export class LessonsController {
  constructor(private readonly lessons: LessonsService) {}

  @Post()
  async create(@Body() body: unknown) {
    try {
      const dto = await createLessonDto.parseAsync(body);
      return await this.lessons.create(dto);
    } catch (e) {
      if (e instanceof ZodError) throw new BadRequestException(e.errors);
      throw e;
    }
  }

  @Get()
  async findAll(@Query() query: Record<string, unknown>) {
    try {
      const filters = await listQuery.parseAsync(query);
      return await this.lessons.findAll(filters);
    } catch (e) {
      if (e instanceof ZodError) throw new BadRequestException(e.errors);
      throw e;
    }
  }

  @Get(":id")
  async findOne(@Param("id") idRaw: string) {
    try {
      const id = idParam.parse(idRaw);
      return await this.lessons.findOne(id);
    } catch (e) {
      if (e instanceof ZodError) throw new BadRequestException(e.errors);
      throw e;
    }
  }

  @Patch(":id")
  async update(@Param("id") idRaw: string, @Body() body: unknown) {
    try {
      const id = idParam.parse(idRaw);
      const dto = await updateLessonDto.parseAsync(body);
      return await this.lessons.update(id, dto);
    } catch (e) {
      if (e instanceof ZodError) throw new BadRequestException(e.errors);
      throw e;
    }
  }

  @Delete(":id")
  async remove(@Param("id") idRaw: string) {
    try {
      const id = idParam.parse(idRaw);
      return await this.lessons.remove(id);
    } catch (e) {
      if (e instanceof ZodError) throw new BadRequestException(e.errors);
      throw e;
    }
  }
}
