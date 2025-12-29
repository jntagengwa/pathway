import { withTenantRlsContext } from "@pathway/db";
import { randomUUID } from "node:crypto";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../app.module";
import type { PathwayAuthClaims } from "@pathway/auth";
import { requireDatabase, isDatabaseAvailable } from "../../../test-helpers.e2e";

const ids = {
  group: randomUUID(),
  group2: randomUUID(),
  child: randomUUID(),
} as const;

const nonce = Date.now();

const TENANT_A_ID = process.env.E2E_TENANT_ID;
const TENANT_B_ID = process.env.E2E_TENANT2_ID;
const ORG_ID = process.env.E2E_ORG_ID;
const TENANT_A_SLUG = "e2e-tenant-a";
const ORG_SLUG = "e2e-org";

if (!TENANT_A_ID || !TENANT_B_ID || !ORG_ID) {
  throw new Error(
    "E2E_TENANT_ID / E2E_TENANT2_ID / E2E_ORG_ID are missing. Ensure test.setup.e2e.ts seeds tenants and exports their IDs.",
  );
}

describe("Attendance (e2e)", () => {
  let app: INestApplication;
  let createdId: string;
  let authHeader: string;

  const buildAuthHeader = (claims: PathwayAuthClaims) => {
    const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
    return `Bearer test.${payload}.sig`;
  };

  beforeAll(async () => {
    if (!requireDatabase()) {
      return;
    }

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    // Seed inside RLS-aware context for each tenant
    await withTenantRlsContext(TENANT_A_ID, ORG_ID, async (tx) => {
      // cleanup for deterministic runs
      await tx.attendance.deleteMany({
        where: {
          OR: [
            { childId: ids.child },
            { groupId: { in: [ids.group, ids.group2] } },
          ],
        },
      });
      await tx.child.deleteMany({ where: { id: ids.child } });
      await tx.group.deleteMany({
        where: { id: { in: [ids.group, ids.group2] } },
      });

      await tx.group.create({
        data: {
          id: ids.group,
          name: `Kids A ${nonce}` as string,
          tenantId: TENANT_A_ID,
          minAge: 3,
          maxAge: 5,
        },
      });
      await tx.child.create({
        data: {
          id: ids.child,
          firstName: "Sam",
          lastName: "Smith",
          tenantId: TENANT_A_ID,
          groupId: ids.group,
          allergies: "none",
          disabilities: [],
        },
      });
    });

    await withTenantRlsContext(TENANT_B_ID, ORG_ID, async (tx) => {
      await tx.group.deleteMany({
        where: { id: { in: [ids.group, ids.group2] } },
      });
      await tx.group.create({
        data: {
          id: ids.group2,
          name: `Kids B ${nonce}` as string,
          tenantId: TENANT_B_ID,
          minAge: 6,
          maxAge: 8,
        },
      });
    });

    authHeader = buildAuthHeader({
      sub: "attendance-e2e",
      "https://pathway.app/user": { id: "attendance-e2e" },
      "https://pathway.app/org": {
        orgId: ORG_ID,
        slug: ORG_SLUG,
        name: "E2E Org",
      },
      "https://pathway.app/tenant": {
        tenantId: TENANT_A_ID,
        orgId: ORG_ID,
        slug: TENANT_A_SLUG,
      },
      "https://pathway.app/org_roles": ["org:admin"],
      "https://pathway.app/tenant_roles": ["tenant:admin"],
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it("GET /attendance should return array", async () => {
    if (!app) return;
    const res = await request(app.getHttpServer())
      .get("/attendance")
      .set("Authorization", authHeader);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /attendance should create a record", async () => {
    const res = await request(app.getHttpServer())
      .post("/attendance")
      .send({ childId: ids.child, groupId: ids.group, present: true })
      .set("content-type", "application/json")
      .set("Authorization", authHeader);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      childId: ids.child,
      groupId: ids.group,
      present: true,
    });
    expect(res.body).toHaveProperty("id");
    createdId = res.body.id;
  });

  it("GET /attendance/:id should return created record", async () => {
    if (!app) return;
    const res = await request(app.getHttpServer())
      .get(`/attendance/${createdId}`)
      .set("Authorization", authHeader);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: createdId,
      childId: ids.child,
      groupId: ids.group,
    });
  });

  it("PATCH /attendance/:id should update present", async () => {
    if (!app) return;
    const res = await request(app.getHttpServer())
      .patch(`/attendance/${createdId}`)
      .send({ present: false })
      .set("content-type", "application/json")
      .set("Authorization", authHeader);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: createdId, present: false });
  });

  it("POST /attendance should 404 when child/group cross-tenant", async () => {
    if (!app) return;
    const res = await request(app.getHttpServer())
      .post("/attendance")
      .send({ childId: ids.child, groupId: ids.group2, present: true })
      .set("content-type", "application/json")
      .set("Authorization", authHeader);

    expect(res.status).toBe(404);
  });

  it("GET /attendance should not leak other tenant records", async () => {
    if (!app || !isDatabaseAvailable()) return;
    const childB = await withTenantRlsContext(TENANT_B_ID, ORG_ID, async (tx) =>
      tx.child.create({
        data: {
          firstName: "Other",
          lastName: "Child",
          tenantId: TENANT_B_ID,
          groupId: ids.group2,
          allergies: "none",
          disabilities: [],
        } as unknown as Parameters<typeof tx.child.create>[0]["data"],
      }),
    );
    await withTenantRlsContext(TENANT_B_ID, ORG_ID, async (tx) =>
      tx.attendance.create({
        data: {
          childId: childB.id,
          groupId: ids.group2,
          present: true,
        },
      }),
    );

    const res = await request(app.getHttpServer())
      .get("/attendance")
      .set("Authorization", authHeader);

    expect(res.status).toBe(200);
    expect(
      res.body.every((row: { childId: string }) => row.childId !== childB.id),
    ).toBe(true);
  });

  it("GET /attendance/:id should 404 for other tenant record", async () => {
    if (!app || !isDatabaseAvailable()) return;
    const childB = await withTenantRlsContext(TENANT_B_ID, ORG_ID, async (tx) =>
      tx.child.create({
        data: {
          firstName: "Other2",
          lastName: "Child",
          tenantId: TENANT_B_ID,
          groupId: ids.group2,
          allergies: "none",
          disabilities: [],
        } as unknown as Parameters<typeof tx.child.create>[0]["data"],
      }),
    );
    const attendanceB = await withTenantRlsContext(
      TENANT_B_ID,
      ORG_ID,
      async (tx) =>
        tx.attendance.create({
          data: {
            childId: childB.id,
            groupId: ids.group2,
            present: false,
          },
        }),
    );

    const res = await request(app.getHttpServer())
      .get(`/attendance/${attendanceB.id}`)
      .set("Authorization", authHeader);

    expect(res.status).toBe(404);
  });
});
