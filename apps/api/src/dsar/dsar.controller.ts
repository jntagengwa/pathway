import {
  Controller,
  Get,
  Param,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { z } from "zod";
import { PathwayAuthGuard, CurrentTenant, UserOrgRole, UserTenantRole } from "@pathway/auth";
import { SafeguardingGuard } from "../common/safeguarding/safeguarding.guard";
import { AllowedSafeguardingRoles } from "../common/safeguarding/safeguarding.decorator";
import { DsarService } from "./dsar.service";

const childParam = z.object({ childId: z.string().uuid("childId must be a UUID") });

const dsarRoles = {
  tenantRoles: [UserTenantRole.ADMIN],
  orgRoles: [UserOrgRole.SAFEGUARDING_LEAD, UserOrgRole.ORG_ADMIN],
};

@UseGuards(PathwayAuthGuard, SafeguardingGuard)
@Controller("internal/dsar")
export class DsarController {
  constructor(private readonly dsar: DsarService) {}

  @Get("child/:childId")
  @AllowedSafeguardingRoles(dsarRoles)
  async exportChild(
    @Param() params: { childId: string },
    @CurrentTenant("tenantId") tenantId: string,
  ) {
    const { childId } = await parseOrThrow(childParam, params);
    return this.dsar.exportChild(childId, tenantId);
  }
}

async function parseOrThrow<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): Promise<z.infer<T>> {
  try {
    return await schema.parseAsync(data);
  } catch (e) {
    if (e instanceof z.ZodError) {
      throw new BadRequestException(e.flatten());
    }
    throw e;
  }
}

