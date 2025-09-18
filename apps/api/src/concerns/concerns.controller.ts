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
import { z } from "zod";
import { ConcernsService } from "./concerns.service";
import { createConcernDto, updateConcernDto } from "./dto";

const idParam = z.object({ id: z.string().uuid("id must be a valid UUID") });

const listQuery = z
  .object({
    childId: z.string().uuid().optional(),
  })
  .strict();

const parseOrBadRequest = async <T>(
  schema: z.ZodTypeAny,
  data: unknown,
): Promise<T> => {
  try {
    return await schema.parseAsync(data);
  } catch (e) {
    if (e instanceof z.ZodError) {
      throw new BadRequestException(e.flatten());
    }
    throw e;
  }
};

@Controller("concerns")
export class ConcernsController {
  constructor(private readonly service: ConcernsService) {}

  @Post()
  async create(@Body() body: unknown) {
    const dto = await parseOrBadRequest<typeof createConcernDto._output>(
      createConcernDto,
      body,
    );
    return this.service.create(dto);
  }

  @Get()
  async findAll(@Query() query: unknown) {
    const q = await parseOrBadRequest<typeof listQuery._output>(
      listQuery,
      query,
    );
    return this.service.findAll({ childId: q.childId });
  }

  @Get(":id")
  async findOne(@Param() params: unknown) {
    const { id } = await parseOrBadRequest<typeof idParam._output>(
      idParam,
      params,
    );
    return this.service.findOne(id);
  }

  @Patch(":id")
  async update(@Param() params: unknown, @Body() body: unknown) {
    const { id } = await parseOrBadRequest<typeof idParam._output>(
      idParam,
      params,
    );
    const dto = await parseOrBadRequest<typeof updateConcernDto._output>(
      updateConcernDto,
      body,
    );
    return this.service.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param() params: unknown) {
    const { id } = await parseOrBadRequest<typeof idParam._output>(
      idParam,
      params,
    );
    return this.service.remove(id);
  }
}
