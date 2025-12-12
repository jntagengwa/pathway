import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { UserIdentity } from "../types/auth-context";
import { resolveAuthContext } from "./context-resolver";

export type UserField = keyof UserIdentity;

export const resolveCurrentUser = (
  field: UserField | undefined,
  ctx: ExecutionContext,
): UserIdentity[UserField] | UserIdentity => {
  const context = resolveAuthContext(ctx);
  if (!field) return context.user;
  return context.user[field];
};

export const CurrentUser = createParamDecorator(resolveCurrentUser);

