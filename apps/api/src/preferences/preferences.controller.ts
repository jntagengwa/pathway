import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Inject,
} from "@nestjs/common";
import { CurrentTenant } from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
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
@UseGuards(AuthUserGuard)
export class PreferencesController {
  constructor(@Inject(PreferencesService) private readonly preferencesService: PreferencesService) {}

  @Post()
  async create(
    @Body() body: unknown,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    const dto: CreateVolunteerPreferenceDto = zParseOrBadRequest(
      createVolunteerPreferenceDto,
      body,
    );
    return this.preferencesService.create({ ...dto, tenantId }, tenantId);
  }

  @Get()
  async findAll(@CurrentTenant("tenantId") tenantId: string) {
    return this.preferencesService.findAll({ tenantId });
  }

  @Get(":id")
  async findOne(
    @Param() params: IdParamDto,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    const { id } = zParseOrBadRequest(idParamDto, params);
    return this.preferencesService.findOne(id, tenantId);
  }

  @Patch(":id")
  async update(
    @Param() params: IdParamDto,
    @Body() body: unknown,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    const { id } = zParseOrBadRequest(idParamDto, params);
    const dto: UpdateVolunteerPreferenceDto = zParseOrBadRequest(
      updateVolunteerPreferenceDto,
      body,
    );
    return this.preferencesService.update(id, dto, tenantId);
  }

  @Delete(":id")
  async remove(
    @Param() params: IdParamDto,
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    const { id } = zParseOrBadRequest(idParamDto, params);
    return this.preferencesService.remove(id, tenantId);
  }
}
