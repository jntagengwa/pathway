import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../app.module";
import { prisma } from "@pathway/db";

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
  const unique = Date.now();
  const slug = `test-tenant-${unique}`;
  const payload = { name: "Test Tenant", slug };

  beforeAll(async () => {
    // Ensure no residue from previous runs
    await prisma.tenant.deleteMany({ where: { slug } });

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    // Cleanup test data
    await prisma.tenant.deleteMany({ where: { slug } });
  });

  it("GET /tenants should return array", async () => {
    const res = await request(app.getHttpServer()).get("/tenants");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /tenants should create a tenant", async () => {
    const res = await request(app.getHttpServer())
      .post("/tenants")
      .send(payload)
      .set("content-type", "application/json");

    expect(res.status).toBe(201); // Nest default for POST create
    expect(res.body).toMatchObject({ name: payload.name, slug: payload.slug });
  });

  it("GET /tenants/:slug should return the created tenant", async () => {
    const res = await request(app.getHttpServer()).get(`/tenants/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ name: payload.name, slug: payload.slug });
  });

  it("POST /tenants duplicate slug should 400", async () => {
    const res = await request(app.getHttpServer())
      .post("/tenants")
      .send(payload)
      .set("content-type", "application/json");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("POST /tenants invalid slug should 400 (controller DTO validation)", async () => {
    const badPayload = { name: "Bad Tenant", slug: "Bad Slug" }; // invalid format (uppercase + space)
    const res = await request(app.getHttpServer())
      .post("/tenants")
      .send(badPayload)
      .set("content-type", "application/json");

    expect(res.status).toBe(400);
    // Controller returns zod formatted error (no `message` property). Validate the structure.
    expect(res.body).toHaveProperty("slug._errors");
    expect(Array.isArray(res.body.slug._errors)).toBe(true);
    expect(res.body.slug._errors[0]).toMatch(
      /lowercase, numbers and hyphens only/,
    );
  });

  it("GET /tenants/unknown should 404", async () => {
    const res = await request(app.getHttpServer()).get(
      `/tenants/nope-${unique}`,
    );
    expect(res.status).toBe(404);
  });
});
