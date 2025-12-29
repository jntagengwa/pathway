import { randomUUID } from "node:crypto";
import { closePrisma, prisma, withTenantRlsContext } from "@pathway/db";
import { Av30ActivityType } from "@pathway/types/av30";
import {
  Av30ComputeService,
  TenantOrgContext,
} from "../av30-compute.service";

interface SeededIds {
  contexts: TenantOrgContext[];
  orgA: string;
  orgB: string;
  orgC: string;
  tenantA1: string;
  tenantA2: string;
  tenantB1: string;
}

const NOW = new Date("2025-02-01T00:00:00.000Z");
const daysAgo = (days: number) =>
  new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000);

describe("Av30ComputeService", () => {
  const service = new Av30ComputeService();
  let seeded: SeededIds;
  let hasDbPermissions = true;

  beforeEach(async () => {
    try {
      seeded = await seedFixtures();
    } catch (error) {
      // Log the full error for visibility in CI logs
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      console.error("[Av30ComputeService] Error in seedFixtures:", {
        message: errorMessage,
        stack: errorStack,
        error: error,
      });
      
      // Check if it's a permission error
      if (errorMessage.includes("permission denied for schema app")) {
        hasDbPermissions = false;
        console.warn(
          "[Av30ComputeService] Skipping tests: database user lacks permissions on 'app' schema. " +
            "Grant USAGE permission: GRANT USAGE ON SCHEMA app TO <test_user>;",
        );
        return;
      }
      
      // Re-throw with full error context for CI visibility
      throw error;
    }
  });

  afterAll(async () => {
    await closePrisma();
  });

  it("computes distinct staff per org within the last 30 days", async () => {
    if (!hasDbPermissions) {
      console.log("[Av30ComputeService] Skipping test: database permissions not configured");
      return;
    }
    const results = await service.computeForTenants(seeded.contexts, NOW);

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ orgId: seeded.orgA, av30: 2 }),
        expect.objectContaining({ orgId: seeded.orgB, av30: 1 }),
        expect.objectContaining({ orgId: seeded.orgC, av30: 0 }),
      ]),
    );

    const counters = await prisma.usageCounters.findMany({
      orderBy: { orgId: "asc" },
    });

    expect(counters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ orgId: seeded.orgA, av30: 2 }),
        expect.objectContaining({ orgId: seeded.orgB, av30: 1 }),
        expect.objectContaining({ orgId: seeded.orgC, av30: 0 }),
      ]),
    );
    expect(counters.filter((c) => c.orgId === seeded.orgA)).toHaveLength(1);
  });

  it("ignores activity older than 30 days and updates existing counters", async () => {
    if (!hasDbPermissions || !seeded) {
      console.log("[Av30ComputeService] Skipping test: database permissions not configured");
      return;
    }
    await service.computeForTenants(seeded.contexts, NOW);

    const newStaffId = randomUUID();
    await seedTenantActivities(seeded.tenantA1, seeded.orgA, [
      {
        staffUserId: newStaffId,
        occurrences: [daysAgo(1)],
      },
    ]);

    const rerunResults = await service.computeForTenants(
      seeded.contexts,
      NOW,
    );

    const orgAResult = rerunResults.find((r) => r.orgId === seeded.orgA);
    expect(orgAResult?.av30).toBe(3);

    const orgBCounters = await prisma.usageCounters.findMany({
      where: { orgId: seeded.orgB },
    });
    expect(orgBCounters).toHaveLength(1);
    expect(orgBCounters[0].av30).toBe(1);
  });

  async function seedFixtures(): Promise<SeededIds> {
    const orgA = await createOrgWithContext({
      id: randomUUID(),
      name: "Org A",
      slug: `orga-${randomUUID()}`,
      planCode: "starter",
    });
    const orgB = await createOrgWithContext({
      id: randomUUID(),
      name: "Org B",
      slug: `orgb-${randomUUID()}`,
      planCode: "starter",
    });
    const orgC = await createOrgWithContext({
      id: randomUUID(),
      name: "Org C",
      slug: `orgc-${randomUUID()}`,
      planCode: "starter",
    });

    const tenantA1 = await createTenantWithContext({
      id: randomUUID(),
      name: "Tenant A1",
      slug: `tenant-a1-${randomUUID()}`,
      orgId: orgA.id,
    });
    const tenantA2 = await createTenantWithContext({
      id: randomUUID(),
      name: "Tenant A2",
      slug: `tenant-a2-${randomUUID()}`,
      orgId: orgA.id,
    });
    const tenantB1 = await createTenantWithContext({
      id: randomUUID(),
      name: "Tenant B1",
      slug: `tenant-b1-${randomUUID()}`,
      orgId: orgB.id,
    });
    const tenantC1 = await createTenantWithContext({
      id: randomUUID(),
      name: "Tenant C1",
      slug: `tenant-c1-${randomUUID()}`,
      orgId: orgC.id,
    });

    // Org A: one staff inside window, one staff only outside window, one staff in a second tenant
    await seedTenantActivities(tenantA1.id, orgA.id, [
      {
        staffUserId: randomUUID(),
        occurrences: [daysAgo(10)],
      },
      {
        staffUserId: randomUUID(),
        occurrences: [daysAgo(40)], // should be ignored
      },
    ]);
    await seedTenantActivities(tenantA2.id, orgA.id, [
      {
        staffUserId: randomUUID(),
        occurrences: [daysAgo(7), daysAgo(2)], // multiple events, still 1 staff
      },
    ]);

    // Org B: single staff inside window
    await seedTenantActivities(tenantB1.id, orgB.id, [
      {
        staffUserId: randomUUID(),
        occurrences: [daysAgo(8)],
      },
    ]);

    return {
      contexts: [
        { tenantId: tenantA1.id, orgId: orgA.id },
        { tenantId: tenantA2.id, orgId: orgA.id },
        { tenantId: tenantB1.id, orgId: orgB.id },
        { tenantId: tenantC1.id, orgId: orgC.id },
      ],
      orgA: orgA.id,
      orgB: orgB.id,
      orgC: orgC.id,
      tenantA1: tenantA1.id,
      tenantA2: tenantA2.id,
      tenantB1: tenantB1.id,
    };
  }

  async function seedTenantActivities(
    tenantId: string,
    orgId: string,
    activities: Array<{ staffUserId: string; occurrences: Date[] }>,
  ) {
    await withTenantRlsContext(tenantId, orgId, async (tx) => {
      for (const activity of activities) {
        await tx.user.create({
          data: {
            id: activity.staffUserId,
            email: `staff-${activity.staffUserId}@example.test`,
            tenantId,
            name: "Staff",
          },
        });

        await tx.staffActivity.createMany({
          data: activity.occurrences.map((occurredAt) => ({
            tenantId,
            orgId,
            staffUserId: activity.staffUserId,
            activityType: Av30ActivityType.ATTENDANCE_RECORDED,
            occurredAt,
          })),
        });
      }
    });
  }

  async function createOrgWithContext(data: {
    id: string;
    name: string;
    slug: string;
    planCode: string;
  }) {
    try {
      return await prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('app.org_id', ${data.id}, true)`;
        await tx.$executeRaw`SET LOCAL row_security = on`;
        return tx.org.create({ data });
      });
    } catch (error) {
      // Log transaction error with context for debugging
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error("[createOrgWithContext] Transaction failed:", {
        orgId: data.id,
        orgName: data.name,
        errorMessage,
        errorStack,
        error,
      });
      throw error;
    }
  }

  async function createTenantWithContext(data: {
    id: string;
    name: string;
    slug: string;
    orgId: string;
  }) {
    return withTenantRlsContext(data.id, data.orgId, (tx) =>
      tx.tenant.create({ data }),
    );
  }
});

