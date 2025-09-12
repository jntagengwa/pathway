import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../app.module";
import { prisma } from "@pathway/db";

/**
 * E2E tests for Users module
 * - Ensures a dedicated tenant exists for isolation
 * - GET /users returns array
 * - POST /users creates (with tenantId), duplicate email -> 400
 * - GET /users/:id returns the created user
 * - POST invalid payload -> 400
 */

describe("Users (e2e)", () => {
  let app: INestApplication;
  let tenantId: string;
  const unique = Date.now();
  const email = `user${unique}@example.com`;
  const name = "Test User";
  const tenantSlug = `e2e-tenant-${unique}`;

  beforeAll(async () => {
    // Prepare isolated tenant for this test run
    const tenant = await prisma.tenant.upsert({
      where: { slug: tenantSlug },
      create: { name: `E2E Tenant ${unique}`, slug: tenantSlug },
      update: {},
    });
    tenantId = tenant.id;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    // Clean up created users for this email
    await prisma.user.deleteMany({ where: { email } });
    // Then remove the test tenant (must be after users to satisfy FK)
    await prisma.tenant.deleteMany({ where: { id: tenantId } });
    await app.close();
  });

  it("GET /users should return array", async () => {
    const res = await request(app.getHttpServer()).get("/users");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /users should create a user", async () => {
    const res = await request(app.getHttpServer())
      .post("/users")
      .send({ email, name, tenantId })
      .set("content-type", "application/json");

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ email: email.toLowerCase(), name });
    expect(res.body).toHaveProperty("id");
  });

  it("GET /users/:id should return the created user", async () => {
    // Find the created user to get its id
    const created = await prisma.user.findUnique({ where: { email } });
    expect(created).toBeTruthy();
    const res = await request(app.getHttpServer()).get(`/users/${created!.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: created!.id,
      email: email.toLowerCase(),
      name,
    });
  });

  it("POST /users duplicate email should 400", async () => {
    const res = await request(app.getHttpServer())
      .post("/users")
      .send({ email, name: "Dup User", tenantId })
      .set("content-type", "application/json");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("POST /users invalid email should 400", async () => {
    const res = await request(app.getHttpServer())
      .post("/users")
      .send({ email: "not-an-email", name: "Bad", tenantId })
      .set("content-type", "application/json");

    expect(res.status).toBe(400);
  });
});
