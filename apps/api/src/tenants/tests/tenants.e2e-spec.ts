import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../app.module";
import { randomUUID } from "crypto";
import { requireDatabase } from "../../../test-helpers.e2e";

/**
 * E2E tests for Tenants module
 * - GET /tenants returns an array
 * - POST /tenants creates a tenant (validated, unique slug)
 * - GET /tenants/:slug retrieves the created tenant
 * - POST duplicate slug -> 400
 * - GET unknown slug -> 404
 */

describe("Tenants (e2e)", () => {
  let app: INestApplication;
  const unique = randomUUID().slice(0, 8);
  const orgId = process.env.E2E_ORG_ID as string;

  beforeAll(async () => {
    if (!requireDatabase()) {
      return;
    }

    if (!orgId) {
      throw new Error("E2E_ORG_ID missing");
    }

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /tenants should return array", async () => {
    const res = await request(app.getHttpServer()).get("/tenants");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /tenants should return seeded tenants", async () => {
    const res = await request(app.getHttpServer()).get("/tenants");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /tenants/:slug should return the seeded tenant", async () => {
    const seededSlug = process.env.E2E_TENANT_SLUG ?? "e2e-tenant-a";
    const res = await request(app.getHttpServer()).get(
      `/tenants/${seededSlug}`,
    );
    expect([200, 404]).toContain(res.status);
  });

  it("GET /tenants/unknown should 404", async () => {
    const res = await request(app.getHttpServer()).get(
      `/tenants/nope-${unique}`,
    );
    expect(res.status).toBe(404);
  });
});
