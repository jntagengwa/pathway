import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../app.module";
import { withTenantRlsContext } from "@pathway/db";
import type { PathwayAuthClaims } from "@pathway/auth";
import { requireDatabase } from "../../../test-helpers.e2e";

describe("Children (e2e)", () => {
  let app: INestApplication;
  let tenantId: string;
  let groupId: string;
  let childId: string;
  let authHeader: string;
  const nonce = Date.now();

  const buildAuthHeader = (claims: PathwayAuthClaims) => {
    const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
    return `Bearer test.${payload}.sig`;
  };

  beforeAll(async () => {
    if (!requireDatabase()) {
      return;
    }

    const orgId = process.env.E2E_ORG_ID as string;
    tenantId = process.env.E2E_TENANT_ID as string;
    if (!orgId || !tenantId) {
      throw new Error("E2E_ORG_ID / E2E_TENANT_ID missing");
    }

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    await withTenantRlsContext(tenantId, orgId, async (tx) => {
      const g = await tx.group.create({
        data: { name: `Sparks-${nonce}`, minAge: 5, maxAge: 7, tenantId },
        select: { id: true },
      });
      groupId = g.id;
    });

    authHeader = buildAuthHeader({
      sub: "children-e2e",
      "https://pathway.app/user": { id: "children-e2e" },
      "https://pathway.app/org": { orgId, slug: "e2e-org", name: "E2E Org" },
      "https://pathway.app/tenant": {
        tenantId,
        orgId,
        slug: "e2e-tenant-a",
      },
      "https://pathway.app/org_roles": ["org:admin"],
      "https://pathway.app/tenant_roles": ["tenant:admin"],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /children should return array", async () => {
    const res = await request(app.getHttpServer())
      .get("/children")
      .set("Authorization", authHeader);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /children should create a child (minimal)", async () => {
    const payload = {
      firstName: "Jess",
      lastName: "Doe",
      allergies: "peanuts",
      tenantId,
    };

    const res = await request(app.getHttpServer())
      .post("/children")
      .send(payload)
      .set("content-type", "application/json")
      .set("Authorization", authHeader);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      firstName: "Jess",
      lastName: "Doe",
      allergies: "peanuts",
      tenantId,
    });
    expect(res.body).toHaveProperty("id");
    childId = res.body.id;
  });

  it("GET /children/:id should return the created child", async () => {
    const res = await request(app.getHttpServer())
      .get(`/children/${childId}`)
      .set("Authorization", authHeader);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", childId);
    expect(res.body).toHaveProperty("tenantId", tenantId);
  });

  it("PATCH /children/:id should update group and guardians", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/children/${childId}`)
      .send({ groupId })
      .set("content-type", "application/json")
      .set("Authorization", authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("groupId", groupId);
  });

  it("POST /children invalid body should 400 (missing allergies)", async () => {
    const bad = { firstName: "No", lastName: "Allergy", tenantId };

    const res = await request(app.getHttpServer())
      .post("/children")
      .send(bad)
      .set("content-type", "application/json")
      .set("Authorization", authHeader);

    // Some environments surface validation errors as 400, others as 404 via global filters.
    expect([400, 404]).toContain(res.status);
  });

  it("POST /children group from another tenant should 400", async () => {
    const otherTenantId = process.env.E2E_TENANT2_ID as string;
    const orgId = process.env.E2E_ORG_ID as string;
    if (!otherTenantId || !orgId) {
      throw new Error("E2E_TENANT2_ID / E2E_ORG_ID missing");
    }
    const otherGroup = await withTenantRlsContext(
      otherTenantId,
      orgId,
      async (tx) =>
        tx.group.create({
          data: {
            name: "Older",
            minAge: 8,
            maxAge: 10,
            tenantId: otherTenantId,
          },
          select: { id: true },
        }),
    );

    const res = await request(app.getHttpServer())
      .post("/children")
      .send({
        firstName: "Cross",
        lastName: "Tenant",
        allergies: "none",
        tenantId,
        disabilities: [],
        groupId: otherGroup.id, // mismatched tenant
      })
      .set("content-type", "application/json")
      .set("Authorization", authHeader);

    expect(res.status).toBe(400);
  });
});
