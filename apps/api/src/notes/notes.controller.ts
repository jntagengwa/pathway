import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
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
import { NotesService } from "./notes.service";
import { createNoteDto, updateNoteDto } from "./dto";
import { SafeguardingGuard } from "../common/safeguarding/safeguarding.guard";
import { AllowedSafeguardingRoles } from "../common/safeguarding/safeguarding.decorator";

const idParam = z.object({ id: z.string().uuid("id must be a valid UUID") });

const listQuery = z
  .object({
    childId: z.string().uuid().optional(),
    authorId: z.string().uuid().optional(),
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
@Controller("notes")
export class NotesController {
  constructor(@Inject(NotesService) private readonly service: NotesService) {}

  private buildContext(tenantId: string, orgId: string, actorUserId: string) {
    return { tenantId, orgId, actorUserId };
  }

  private static readonly noteAuthorRoles = {
    tenantRoles: [
      UserTenantRole.TEACHER,
      UserTenantRole.STAFF,
      UserTenantRole.COORDINATOR,
      UserTenantRole.ADMIN,
    ],
    orgRoles: [UserOrgRole.SAFEGUARDING_LEAD, UserOrgRole.ORG_ADMIN],
  };

  private static readonly noteManagerRoles = {
    tenantRoles: [UserTenantRole.ADMIN],
    orgRoles: [UserOrgRole.SAFEGUARDING_LEAD, UserOrgRole.ORG_ADMIN],
  };

  @Post()
  @AllowedSafeguardingRoles(NotesController.noteAuthorRoles)
  async create(
    @Body() body: unknown,
    @CurrentTenant("tenantId") tenantId: string,
    @CurrentOrg("orgId") orgId: string,
    @CurrentUser("userId") userId: string,
  ) {
    const dto = await parseOrBadRequest<typeof createNoteDto._output>(
      createNoteDto,
      body,
    );
    return this.service.create(
      dto,
      userId,
      this.buildContext(tenantId, orgId, userId),
    );
  }

  @Get()
  @AllowedSafeguardingRoles(NotesController.noteAuthorRoles)
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
      {
        childId: q.childId,
        authorId: q.authorId,
      },
      this.buildContext(tenantId, orgId, userId),
    );
  }

  @Get(":id")
  @AllowedSafeguardingRoles(NotesController.noteAuthorRoles)
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
  @AllowedSafeguardingRoles(NotesController.noteManagerRoles)
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
    const dto = await parseOrBadRequest<typeof updateNoteDto._output>(
      updateNoteDto,
      body,
    );
    return this.service.update(
      id,
      dto,
      this.buildContext(tenantId, orgId, userId),
    );
  }

  @Delete(":id")
  @AllowedSafeguardingRoles(NotesController.noteManagerRoles)
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
