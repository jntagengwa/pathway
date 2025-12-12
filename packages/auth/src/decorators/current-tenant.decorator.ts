import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { TenantContext } from "../types/auth-context";
import { resolveAuthContext } from "./context-resolver";

export type TenantField = keyof TenantContext;

export const resolveCurrentTenant = (
  field: TenantField | undefined,
  ctx: ExecutionContext,
): TenantContext[TenantField] | TenantContext => {
  const context = resolveAuthContext(ctx);
  if (!field) return context.tenant;
  return context.tenant[field];
};

export const CurrentTenant = createParamDecorator(resolveCurrentTenant);

