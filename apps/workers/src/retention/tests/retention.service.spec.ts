import { RetentionService } from "../retention.service";
import { RetentionConfigService } from "../retention-config.service";

const prismaMock = {
  tenant: { findMany: jest.fn() },
  staffActivity: { deleteMany: jest.fn() },
  attendance: { deleteMany: jest.fn() },
  auditEvent: { deleteMany: jest.fn() },
};

const withTenantRlsContextMock = jest
  .fn()
  .mockImplementation(async (_t: string, _o: string, cb: any) =>
    cb(prismaMock),
  ); // eslint-disable-line @typescript-eslint/no-explicit-any

jest.mock("@pathway/db", () => {
  const actual = jest.requireActual("@pathway/db");
  return {
    ...actual,
    get prisma() {
      return prismaMock;
    },
    withTenantRlsContext: (...args: unknown[]) =>
      withTenantRlsContextMock(...args),
  };
});

describe("RetentionService", () => {
  const config: jest.Mocked<RetentionConfigService> = {
    resolveForOrg: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RETENTION_ENABLED = "true";
    prismaMock.tenant.findMany.mockReset();
    prismaMock.staffActivity.deleteMany.mockReset();
    prismaMock.attendance.deleteMany.mockReset();
    prismaMock.auditEvent.deleteMany.mockReset();
  });

  it("skips when RETENTION_ENABLED is not true", async () => {
    process.env.RETENTION_ENABLED = "false";
    const svc = new RetentionService(
      config as unknown as RetentionConfigService,
      prismaMock as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );
    await svc.run(new Date("2025-01-31T00:00:00Z"));
    expect(prismaMock.tenant.findMany).not.toHaveBeenCalled();
  });

  it("deletes old records per tenant", async () => {
    prismaMock.tenant.findMany.mockResolvedValue([
      { id: "t1", orgId: "o1" },
      { id: "t2", orgId: "o2" },
    ]);
    config.resolveForOrg.mockResolvedValue({
      attendanceRetentionDays: 10,
      staffActivityRetentionDays: 5,
      auditEventRetentionDays: 7,
    });
    prismaMock.staffActivity.deleteMany.mockResolvedValue({ count: 2 });
    prismaMock.attendance.deleteMany.mockResolvedValue({ count: 3 });
    prismaMock.auditEvent.deleteMany.mockResolvedValue({ count: 1 });

    const svc = new RetentionService(
      config as unknown as RetentionConfigService,
      prismaMock as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );
    await svc.run(new Date("2025-02-01T00:00:00Z"));

    expect(prismaMock.tenant.findMany).toHaveBeenCalledTimes(1);
    expect(withTenantRlsContextMock).toHaveBeenCalledWith(
      "t1",
      "o1",
      expect.any(Function),
    );
    expect(prismaMock.attendance.deleteMany).toHaveBeenCalled();
    expect(prismaMock.staffActivity.deleteMany).toHaveBeenCalled();
    expect(prismaMock.auditEvent.deleteMany).toHaveBeenCalled();
  });
});

