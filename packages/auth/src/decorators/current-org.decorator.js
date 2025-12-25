import { createParamDecorator } from "@nestjs/common";
import { resolveAuthContext } from "./context-resolver";
export const resolveCurrentOrg = (field, ctx) => {
    const context = resolveAuthContext(ctx);
    if (!field)
        return context.org;
    return context.org[field];
};
export const CurrentOrg = createParamDecorator(resolveCurrentOrg);
