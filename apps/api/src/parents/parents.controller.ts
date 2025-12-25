import {
  Controller,
  Get,
  Param,
  UseGuards,
  NotFoundException,
  ForbiddenException,
  Inject,
} from "@nestjs/common";
import {
  CurrentOrg,
  CurrentTenant,
  PathwayRequestContext,
  UserOrgRole,
  UserTenantRole,
} from "@pathway/auth";
import { AuthUserGuard } from "../auth/auth-user.guard";
import { ParentsService } from "./parents.service";
import type { ParentDetailDto, ParentSummaryDto } from "./dto/parents.dto";

@Controller("parents")
@UseGuards(AuthUserGuard)
export class ParentsController {
  constructor(
    @Inject(ParentsService) private readonly parentsService: ParentsService,
    @Inject(PathwayRequestContext) private readonly requestContext: PathwayRequestContext,
  ) {}

  @Get()
  async list(
    @CurrentTenant("tenantId") tenantId: string,
    @CurrentOrg("orgId") orgId: string,
  ): Promise<ParentSummaryDto[]> {
    this.assertStaffAccess();
    return this.parentsService.findAllForTenant(tenantId, orgId);
  }

  @Get(":id")
  async getOne(
    @Param("id") id: string,
    @CurrentTenant("tenantId") tenantId: string,
    @CurrentOrg("orgId") orgId: string,
  ): Promise<ParentDetailDto> {
    this.assertStaffAccess();
    const parent = await this.parentsService.findOneForTenant(
      tenantId,
      orgId,
      id,
    );
    if (!parent) {
      throw new NotFoundException("Parent not found");
    }
    return parent;
  }

  private assertStaffAccess() {
    const roles = this.requestContext.roles;
    const allowedTenant = [
      UserTenantRole.ADMIN,
      UserTenantRole.COORDINATOR,
      UserTenantRole.TEACHER,
      UserTenantRole.STAFF,
    ];
    const allowedOrg = [UserOrgRole.ORG_ADMIN, UserOrgRole.SAFEGUARDING_LEAD];
    const allowed =
      roles.tenant.some((role) => allowedTenant.includes(role)) ||
      roles.org.some((role) => allowedOrg.includes(role));

    if (!allowed) {
      throw new ForbiddenException(
        "Insufficient role to access parents/guardians",
      );
    }
  }
}
