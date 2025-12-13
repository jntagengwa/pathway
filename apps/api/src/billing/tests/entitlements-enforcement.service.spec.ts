import { EntitlementsEnforcementService } from "../entitlements-enforcement.service";
import { EntitlementsService } from "../entitlements.service";

const entitlementsMock = {
  resolve: jest.fn(),
};

describe("EntitlementsEnforcementService", () => {
  let service: EntitlementsEnforcementService;

  const orgId = "org-123";

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EntitlementsEnforcementService(
      entitlementsMock as unknown as EntitlementsService,
    );
  });

  it.each([
    { usage: 50, cap: 100, expected: "OK" },
    { usage: 100, cap: 100, expected: "SOFT_CAP" },
    { usage: 109, cap: 100, expected: "SOFT_CAP" },
    { usage: 110, cap: 100, expected: "GRACE" },
    { usage: 119, cap: 100, expected: "GRACE" },
    { usage: 120, cap: 100, expected: "HARD_CAP" },
  ])(
    "computes status for usage=$usage cap=$cap",
    async ({ usage, cap, expected }) => {
      entitlementsMock.resolve.mockResolvedValue({
        orgId,
        av30Cap: cap,
        currentAv30: usage,
        usageCalculatedAt: new Date("2025-01-01T00:00:00Z"),
      });

      const result = await service.checkAv30ForOrg(orgId);
      expect(result.status).toBe(expected);
      expect(result.av30Cap).toBe(cap);
      expect(result.currentAv30).toBe(usage);
    },
  );

  it("returns OK when cap is missing", async () => {
    entitlementsMock.resolve.mockResolvedValue({
      orgId,
      av30Cap: null,
      currentAv30: 25,
      usageCalculatedAt: null,
    });

    const result = await service.checkAv30ForOrg(orgId);
    expect(result.status).toBe("OK");
    expect(result.messageCode).toBe("av30.no_cap");
  });
});

