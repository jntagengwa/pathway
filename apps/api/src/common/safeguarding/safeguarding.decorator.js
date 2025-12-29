import { SetMetadata } from "@nestjs/common";
export const SAFEGUARDING_ROLES_KEY = "pathway:safeguarding_roles";
export const AllowedSafeguardingRoles = (requirement) => SetMetadata(SAFEGUARDING_ROLES_KEY, requirement);
