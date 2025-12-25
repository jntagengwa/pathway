import { createParamDecorator } from "@nestjs/common";
import { resolveAuthContext } from "./context-resolver";
export const resolveCurrentTenant = (field, ctx) => {
    const context = resolveAuthContext(ctx);
    if (!field)
        return context.tenant;
    return context.tenant[field];
};
export const CurrentTenant = createParamDecorator(resolveCurrentTenant);
