/* eslint-disable no-undef */
import { PATHWAY_CONTEXT_PROPERTY } from "../constants";
import { resolveCurrentTenant } from "../decorators/current-tenant.decorator";
import { resolveCurrentOrg } from "../decorators/current-org.decorator";
import { resolveCurrentUser } from "../decorators/current-user.decorator";
const authContext = {
    user: {
        userId: "user-abc",
        email: "teacher@example.com",
        givenName: "Teacher",
        familyName: "One",
        authProvider: "debug",
    },
    org: {
        orgId: "org-abc",
        slug: "academy",
        name: "Academy Trust",
    },
    tenant: {
        tenantId: "tenant-abc",
        orgId: "org-abc",
        slug: "academy-hub",
    },
    roles: {
        org: [],
        tenant: [],
    },
    permissions: [],
    rawClaims: {},
};
function buildExecutionContext() {
    const request = {
        headers: {},
        [PATHWAY_CONTEXT_PROPERTY]: authContext,
    };
    return {
        switchToHttp: () => ({
            getRequest: () => request,
        }),
    };
}
describe("context-aware decorators", () => {
    it("CurrentTenant returns the tenant object by default", () => {
        const ctx = buildExecutionContext();
        expect(resolveCurrentTenant(undefined, ctx)).toEqual(authContext.tenant);
    });
    it("CurrentOrg can select a specific field", () => {
        const ctx = buildExecutionContext();
        expect(resolveCurrentOrg("orgId", ctx)).toEqual("org-abc");
    });
    it("CurrentUser returns scalar fields when requested", () => {
        const ctx = buildExecutionContext();
        expect(resolveCurrentUser("email", ctx)).toEqual("teacher@example.com");
    });
});
