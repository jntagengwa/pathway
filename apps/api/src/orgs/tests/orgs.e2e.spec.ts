import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../app.module";
import type { PathwayAuthClaims } from "@pathway/auth";
import { requireDatabase } from "../../../test-helpers.e2e";

// Orgs e2e: reuse seeded E2E org/tenant; avoid creating new orgs (RLS)

describe("Orgs (e2e)", () => {
  let app: INestApplication;
  const orgId = process.env.E2E_ORG_ID as string;
  const tenantId = process.env.E2E_TENANT_ID as string;
  const orgSlug = "e2e-org";
  const tenantSlug = "e2e-tenant-a";
  let authHeader: string;

  const buildAuthHeader = (claims: PathwayAuthClaims) => {
    const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
    return `Bearer test.${payload}.sig`;
  };

  beforeAll(async () => {
    if (!requireDatabase()) {
      return;
    }

    if (!orgId || !tenantId)
      throw new Error("E2E_ORG_ID / E2E_TENANT_ID missing");

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    authHeader = buildAuthHeader({
      sub: "orgs-e2e-user",
      "https://pathway.app/user": { id: "orgs-e2e-user" },
      "https://pathway.app/org": { orgId, slug: orgSlug, name: "E2E Org" },
      "https://pathway.app/tenant": { tenantId, orgId, slug: tenantSlug },
      "https://pathway.app/org_roles": ["org:admin"],
      "https://pathway.app/tenant_roles": ["tenant:admin"],
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it("GET /orgs/:slug should return seeded org", async () => {
    if (!app) return;
    const res = await request(app.getHttpServer())
      .get(`/orgs/${orgSlug}`)
      .set("Authorization", authHeader);
    expect(res.status).toBe(200);
    expect(res.body.slug).toBe(orgSlug);
    expect(res.body.id).toBe(orgId);
  });

  it("GET /orgs should list orgs including the seeded one", async () => {
    const res = await request(app.getHttpServer())
      .get("/orgs")
      .set("Authorization", authHeader);
    expect(res.status).toBe(200);
    const slugs: string[] = res.body.map((o: { slug: string }) => o.slug);
    expect(slugs.includes(orgSlug)).toBe(true);
  });

  it("GET /orgs/:slug should 404 for unknown org", async () => {
    const res = await request(app.getHttpServer())
      .get(`/orgs/unknown-${Date.now()}`)
      .set("Authorization", authHeader);
    expect(res.status).toBe(404);
  });
});
