import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { PreferencesService } from "./preferences.service";
import {
  createVolunteerPreferenceDto,
  updateVolunteerPreferenceDto,
  CreateVolunteerPreferenceDto,
  UpdateVolunteerPreferenceDto,
  idParamDto,
  IdParamDto,
} from "./dto";
import type { ZodSchema } from "zod";

// Convert Zod validation failures into HTTP 400 instead of 500
function zParseOrBadRequest<T>(schema: ZodSchema<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new BadRequestException(result.error.issues);
  }
  return result.data;
}

@Controller("preferences")
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Post()
  async create(@Body() body: unknown) {
    const dto: CreateVolunteerPreferenceDto = zParseOrBadRequest(
      createVolunteerPreferenceDto,
      body,
    );
    return this.preferencesService.create(dto);
  }

  @Get()
  async findAll() {
    return this.preferencesService.findAll();
  }

  @Get(":id")
  async findOne(@Param() params: IdParamDto) {
    const { id } = zParseOrBadRequest(idParamDto, params);
    return this.preferencesService.findOne(id);
  }

  @Patch(":id")
  async update(@Param() params: IdParamDto, @Body() body: unknown) {
    const { id } = zParseOrBadRequest(idParamDto, params);
    const dto: UpdateVolunteerPreferenceDto = zParseOrBadRequest(
      updateVolunteerPreferenceDto,
      body,
    );
    return this.preferencesService.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param() params: IdParamDto) {
    const { id } = zParseOrBadRequest(idParamDto, params);
    return this.preferencesService.remove(id);
  }
}
