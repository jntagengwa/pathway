import { SetMetadata } from "@nestjs/common";
import type { SafeguardingRoleRequirement } from "./safeguarding.types";

export const SAFEGUARDING_ROLES_KEY = "pathway:safeguarding_roles";

export const AllowedSafeguardingRoles = (
  requirement: SafeguardingRoleRequirement,
) => SetMetadata(SAFEGUARDING_ROLES_KEY, requirement);

