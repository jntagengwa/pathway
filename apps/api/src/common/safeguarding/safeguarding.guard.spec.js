import { ForbiddenException } from "@nestjs/common";
import { EMPTY_ROLE_SET, UserTenantRole, } from "@pathway/auth";
import { SafeguardingGuard } from "./safeguarding.guard";
const buildExecutionContext = () => ({
    getHandler: () => ({}),
    getClass: () => ({}),
});
describe("SafeguardingGuard", () => {
    let guard;
    const reflector = {
        getAllAndOverride: jest.fn(),
    };
    const requestContext = {
        roles: { ...EMPTY_ROLE_SET, tenant: [UserTenantRole.TEACHER] },
    };
    beforeEach(() => {
        reflector.getAllAndOverride.mockReset();
        requestContext.roles = {
            ...EMPTY_ROLE_SET,
            tenant: [UserTenantRole.TEACHER],
        };
        guard = new SafeguardingGuard(reflector, requestContext);
    });
    it("allows execution when no metadata is defined", () => {
        reflector.getAllAndOverride.mockReturnValue(undefined);
        expect(guard.canActivate(buildExecutionContext())).toBe(true);
    });
    it("allows when user has at least one required role", () => {
        reflector.getAllAndOverride.mockReturnValue({
            tenantRoles: [UserTenantRole.TEACHER],
        });
        expect(guard.canActivate(buildExecutionContext())).toBe(true);
    });
    it("throws Forbidden when user lacks required roles", () => {
        reflector.getAllAndOverride.mockReturnValue({
            tenantRoles: [UserTenantRole.ADMIN],
        });
        expect(() => guard.canActivate(buildExecutionContext())).toThrow(ForbiddenException);
    });
});
