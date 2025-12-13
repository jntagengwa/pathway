import { RetentionConfigService } from "../retention-config.service";

const prismaMock = {
  orgRetentionPolicy: { findUnique: jest.fn() },
};

jest.mock("@pathway/db", () => {
  const actual = jest.requireActual("@pathway/db");
  return {
    ...actual,
    get prisma() {
      return prismaMock;
    },
  };
});

describe("RetentionConfigService", () => {
  let svc: RetentionConfigService;
  const orgId = "org-1";

  beforeEach(() => {
    jest.clearAllMocks();
    svc = new RetentionConfigService();
  });

  it("returns defaults when no policy exists", async () => {
    prismaMock.orgRetentionPolicy.findUnique.mockResolvedValue(null);
    const result = await svc.resolveForOrg(orgId);
    expect(result.attendanceRetentionDays).toBeGreaterThan(0);
  });

  it("returns org-specific policy when present", async () => {
    prismaMock.orgRetentionPolicy.findUnique.mockResolvedValue({
      attendanceRetentionDays: 100,
      staffActivityRetentionDays: 50,
      auditEventRetentionDays: 60,
    });

    const result = await svc.resolveForOrg(orgId);
    expect(result.attendanceRetentionDays).toBe(100);
    expect(result.staffActivityRetentionDays).toBe(50);
    expect(result.auditEventRetentionDays).toBe(60);
  });
});

