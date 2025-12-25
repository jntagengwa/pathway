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
  UseGuards,
  Inject,
} from "@nestjs/common";
import {
  CurrentOrg,
  CurrentTenant,
  CurrentUser,
  UserOrgRole,
  UserTenantRole,
} from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { z } from "zod";
import { ConcernsService } from "./concerns.service";
import { createConcernDto, updateConcernDto } from "./dto";
import { SafeguardingGuard } from "../common/safeguarding/safeguarding.guard";
import { AllowedSafeguardingRoles } from "../common/safeguarding/safeguarding.decorator";

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

@UseGuards(AuthUserGuard, SafeguardingGuard)
@Controller("concerns")
export class ConcernsController {
  constructor(@Inject(ConcernsService) private readonly service: ConcernsService) {}

  private buildContext(tenantId: string, orgId: string, actorUserId: string) {
    return { tenantId, orgId, actorUserId };
  }

  private static readonly safeguardingAdmins = {
    tenantRoles: [UserTenantRole.ADMIN],
    orgRoles: [UserOrgRole.SAFEGUARDING_LEAD, UserOrgRole.ORG_ADMIN],
  };

  private static readonly safeguardingDelete = {
    tenantRoles: [UserTenantRole.ADMIN],
    orgRoles: [UserOrgRole.ORG_ADMIN],
  };

  @Post()
  @AllowedSafeguardingRoles(ConcernsController.safeguardingAdmins)
  async create(
    @Body() body: unknown,
    @CurrentTenant("tenantId") tenantId: string,
    @CurrentOrg("orgId") orgId: string,
    @CurrentUser("userId") userId: string,
  ) {
    const dto = await parseOrBadRequest<typeof createConcernDto._output>(
      createConcernDto,
      body,
    );
    return this.service.create(dto, this.buildContext(tenantId, orgId, userId));
  }

  @Get()
  @AllowedSafeguardingRoles(ConcernsController.safeguardingAdmins)
  async findAll(
    @Query() query: unknown,
    @CurrentTenant("tenantId") tenantId: string,
    @CurrentOrg("orgId") orgId: string,
    @CurrentUser("userId") userId: string,
  ) {
    const q = await parseOrBadRequest<typeof listQuery._output>(
      listQuery,
      query,
    );
    return this.service.findAll(
      { childId: q.childId },
      this.buildContext(tenantId, orgId, userId),
    );
  }

  @Get(":id")
  @AllowedSafeguardingRoles(ConcernsController.safeguardingAdmins)
  async findOne(
    @Param() params: unknown,
    @CurrentTenant("tenantId") tenantId: string,
    @CurrentOrg("orgId") orgId: string,
    @CurrentUser("userId") userId: string,
  ) {
    const { id } = await parseOrBadRequest<typeof idParam._output>(
      idParam,
      params,
    );
    return this.service.findOne(id, this.buildContext(tenantId, orgId, userId));
  }

  @Patch(":id")
  @AllowedSafeguardingRoles(ConcernsController.safeguardingAdmins)
  async update(
    @Param() params: unknown,
    @Body() body: unknown,
    @CurrentTenant("tenantId") tenantId: string,
    @CurrentOrg("orgId") orgId: string,
    @CurrentUser("userId") userId: string,
  ) {
    const { id } = await parseOrBadRequest<typeof idParam._output>(
      idParam,
      params,
    );
    const dto = await parseOrBadRequest<typeof updateConcernDto._output>(
      updateConcernDto,
      body,
    );
    return this.service.update(
      id,
      dto,
      this.buildContext(tenantId, orgId, userId),
    );
  }

  @Delete(":id")
  @AllowedSafeguardingRoles(ConcernsController.safeguardingDelete)
  async remove(
    @Param() params: unknown,
    @CurrentTenant("tenantId") tenantId: string,
    @CurrentOrg("orgId") orgId: string,
    @CurrentUser("userId") userId: string,
  ) {
    const { id } = await parseOrBadRequest<typeof idParam._output>(
      idParam,
      params,
    );
    return this.service.remove(id, this.buildContext(tenantId, orgId, userId));
  }
}
