import {
  Controller,
  Get,
  Param,
  UseGuards,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import {
  CurrentOrg,
  CurrentTenant,
  PathwayAuthGuard,
  PathwayRequestContext,
  UserOrgRole,
  UserTenantRole,
} from "@pathway/auth";
import { ParentsService } from "./parents.service";

@Controller("parents")
@UseGuards(PathwayAuthGuard)
export class ParentsController {
  constructor(
    private readonly parentsService: ParentsService,
    private readonly requestContext: PathwayRequestContext,
  ) {}

  @Get()
  async list(
    @CurrentTenant("tenantId") tenantId: string,
    @CurrentOrg("orgId") orgId: string,
  ) {
    this.assertStaffAccess();
    // TODO: pagination and name/email search
    return this.parentsService.findAllForTenant(tenantId, orgId);
  }

  @Get(":id")
  async getOne(
    @Param("id") id: string,
    @CurrentTenant("tenantId") tenantId: string,
    @CurrentOrg("orgId") orgId: string,
  ) {
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
      // TODO: split finer-grained roles per safeguarding policy.
      throw new ForbiddenException(
        "Insufficient role to access parents/guardians",
      );
    }
  }
}
