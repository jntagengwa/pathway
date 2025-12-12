import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";
import { OrgsService } from "./orgs.service";
import { registerOrgDto } from "./dto/register-org.dto";
import { CurrentOrg, PathwayAuthGuard } from "@pathway/auth";

const parseOrBadRequest = async <T>(
  schema: z.ZodTypeAny,
  data: unknown,
): Promise<T> => {
  try {
    return await schema.parseAsync(data);
  } catch (e) {
    if (e instanceof z.ZodError) {
      console.error(
        "[OrgsController] Zod validation failed:",
        JSON.stringify(e.flatten(), null, 2),
      );
      throw new BadRequestException(e.flatten());
    }
    throw e;
  }
};

const slugParam = z
  .object({
    slug: z.string().min(1, "slug is required"),
  })
  .strict();

@Controller("orgs")
export class OrgsController {
  constructor(private readonly service: OrgsService) {}

  /**
   * Registers a new organisation (and optional first tenant), optionally bootstrapping billing.
   * Accepts the DTO defined in register-org.dto. Returns created org, initial tenant (if any),
   * and admin/billing outcomes.
   */
  @Post("register")
  async register(@Body() body: unknown) {
    const dto = await parseOrBadRequest<typeof registerOrgDto._output>(
      registerOrgDto,
      body,
    );
    return this.service.register(dto);
  }

  /**
   * List organisations (MVP: no filters).
   */
  @Get()
  @UseGuards(PathwayAuthGuard)
  async list(@CurrentOrg("orgId") orgId: string) {
    return this.service.list(orgId);
  }

  /**
   * Fetch an organisation by slug.
   */
  @Get(":slug")
  @UseGuards(PathwayAuthGuard)
  async getBySlug(
    @Param() params: unknown,
    @CurrentOrg("orgId") orgId: string,
  ) {
    console.log("[OrgsController] Incoming params:", params);
    const { slug } = await parseOrBadRequest<typeof slugParam._output>(
      slugParam,
      params,
    );
    return this.service.getBySlug(slug, orgId);
  }
}
