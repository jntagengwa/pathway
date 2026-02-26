import { ForbiddenException } from "@nestjs/common";
import {
  assertTenantAdmin,
  isTenantAdmin,
  type HandoverAuthenticatedRequest,
} from "../handover.auth";

describe("handover auth helpers", () => {
  const baseReq = {
    authUserId: "user-1",
    __pathwayContext: {
      tenant: { tenantId: "tenant-1", orgId: "org-1" },
      org: { orgId: "org-1" },
      siteRole: null,
      roles: { org: [] as string[], tenant: [] as string[] },
    },
  } as unknown as HandoverAuthenticatedRequest;

  it("isTenantAdmin returns true when siteRole is SITE_ADMIN", () => {
    const req = {
      ...baseReq,
      __pathwayContext: {
        ...baseReq.__pathwayContext,
        siteRole: "SITE_ADMIN",
      },
    } as unknown as HandoverAuthenticatedRequest;

    expect(isTenantAdmin(req)).toBe(true);
  });

  it("isTenantAdmin returns true when tenant roles include tenant:admin", () => {
    const req = {
      ...baseReq,
      __pathwayContext: {
        ...baseReq.__pathwayContext,
        roles: { org: [], tenant: ["tenant:admin"] },
      },
    } as unknown as HandoverAuthenticatedRequest;

    expect(isTenantAdmin(req)).toBe(true);
  });

  it("isTenantAdmin returns false otherwise", () => {
    expect(isTenantAdmin(baseReq)).toBe(false);
  });

  it("assertTenantAdmin throws when not admin", () => {
    expect(() => assertTenantAdmin(baseReq)).toThrow(ForbiddenException);
  });

  it("assertTenantAdmin does not throw for admin", () => {
    const req = {
      ...baseReq,
      __pathwayContext: {
        ...baseReq.__pathwayContext,
        siteRole: "SITE_ADMIN",
      },
    } as unknown as HandoverAuthenticatedRequest;

    expect(() => assertTenantAdmin(req)).not.toThrow();
  });
});

