import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { OrgContext } from "../types/auth-context";
import { resolveAuthContext } from "./context-resolver";

export type OrgField = keyof OrgContext;

export const resolveCurrentOrg = (
  field: OrgField | undefined,
  ctx: ExecutionContext,
): OrgContext[OrgField] | OrgContext => {
  const context = resolveAuthContext(ctx);
  if (!field) return context.org;
  return context.org[field];
};

export const CurrentOrg = createParamDecorator(resolveCurrentOrg);

