import { prisma } from "@pathway/db";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../app.module";

const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

describe("Groups (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    // Clean tables in FK-safe order (dependents first)
    await prisma.attendance.deleteMany({});
    await prisma.child.deleteMany({});
    await prisma.group.deleteMany({});
    await prisma.userTenantRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // Seed a tenant for group creation tests
    await prisma.tenant.create({
      data: { id: tenantId, name: "Demo Tenant", slug: "demo-tenant" },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  // Example test using tenantId
  it("POST /groups should create a group for tenant", async () => {
    const res = await request(app.getHttpServer())
      .post("/groups")
      .send({ name: "Test Group", minAge: 3, maxAge: 5, tenantId })
      .set("content-type", "application/json");

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: "Test Group",
      minAge: 3,
      maxAge: 5,
      tenantId,
    });
    expect(res.body).toHaveProperty("id");
  });

  // Other tests referencing tenantId similarly...
});
