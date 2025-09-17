import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../app.module";
import { prisma } from "@pathway/db";

/**
 * E2E tests for Groups module
 * - Isolated tenant per run
 * - GET /groups returns array
 * - POST /groups creates group (requires minAge/maxAge)
 * - GET /groups/:id returns the created group
 * - PATCH /groups/:id updates group
 * - POST duplicate (same tenant+name) -> 400
 * - POST invalid ages -> 400
 */

describe("Groups (e2e)", () => {
  let app: INestApplication;
  let tenantId: string;
  let createdGroupId: string;

  const nonce = Date.now();
  const tenantSlug = `e2e-groups-tenant-${nonce}`;
  const baseName = `Group-${nonce}`;

  beforeAll(async () => {
    // Ensure isolated tenant exists for this suite only (no global truncate)
    const tenant = await prisma.tenant.upsert({
      where: { slug: tenantSlug },
      create: { name: `E2E Groups Tenant ${nonce}`, slug: tenantSlug },
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
    // Cleanup is handled by per-suite TRUNCATE; nothing to do here except close app
    await app.close();
  });

  it("GET /groups should return array", async () => {
    const res = await request(app.getHttpServer()).get("/groups");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /groups should create a group", async () => {
    const res = await request(app.getHttpServer())
      .post("/groups")
      .send({ name: baseName, tenantId, minAge: 7, maxAge: 9 })
      .set("content-type", "application/json");

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: baseName,
      tenantId,
      minAge: 7,
      maxAge: 9,
    });
    expect(res.body).toHaveProperty("id");
    createdGroupId = res.body.id;
  });

  it("GET /groups/:id should return the created group", async () => {
    const res = await request(app.getHttpServer()).get(
      `/groups/${createdGroupId}`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: createdGroupId,
      name: baseName,
      tenantId,
      minAge: 7,
      maxAge: 9,
    });
  });

  it("PATCH /groups/:id should update group", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/groups/${createdGroupId}`)
      .send({ name: `Group-${nonce}-updated`, minAge: 6, maxAge: 10 })
      .set("content-type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: createdGroupId,
      name: `Group-${nonce}-updated`,
      tenantId,
      minAge: 6,
      maxAge: 10,
    });
  });

  it("POST /groups duplicate name for same tenant should 400", async () => {
    // First create another group with a fixed name
    const name = `Group-${nonce}-dup`;
    const res1 = await request(app.getHttpServer())
      .post("/groups")
      .send({ name, tenantId, minAge: 5, maxAge: 6 })
      .set("content-type", "application/json");
    expect(res1.status).toBe(201);

    // Attempt duplicate under same tenant
    const res2 = await request(app.getHttpServer())
      .post("/groups")
      .send({ name, tenantId, minAge: 5, maxAge: 6 })
      .set("content-type", "application/json");

    expect(res2.status).toBe(400);
  });

  it("POST /groups invalid ages should 400", async () => {
    const res = await request(app.getHttpServer())
      .post("/groups")
      .send({ name: `Group-${nonce}-bad`, tenantId, minAge: 10, maxAge: 9 }) // invalid: minAge > maxAge
      .set("content-type", "application/json");

    expect(res.status).toBe(400);
  });
});
