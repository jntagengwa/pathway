import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../app.module";
import { prisma } from "@pathway/db";

describe("Children (e2e)", () => {
  let app: INestApplication;
  let tenantId: string;
  let groupId: string;
  let guardianId: string;
  let childId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    // Ensure a fresh tenant for isolation
    const t = await prisma.tenant.create({
      data: { name: "ChildTest Tenant", slug: `childtest-${Date.now()}` },
      select: { id: true },
    });
    tenantId = t.id;

    // A group in the same tenant
    const g = await prisma.group.create({
      data: { name: "Sparks", minAge: 5, maxAge: 7, tenantId },
      select: { id: true },
    });
    groupId = g.id;

    // A guardian user in the same tenant
    const u = await prisma.user.create({
      data: {
        email: `guardian_${Date.now()}@example.com`,
        name: "Guardian One",
        tenantId,
      },
      select: { id: true },
    });
    guardianId = u.id;
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it("GET /children should return array", async () => {
    const res = await request(app.getHttpServer()).get("/children");
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
      .set("content-type", "application/json");

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
    const res = await request(app.getHttpServer()).get(`/children/${childId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id", childId);
    expect(res.body).toHaveProperty("tenantId", tenantId);
  });

  it("PATCH /children/:id should update group and guardians", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/children/${childId}`)
      .send({ groupId, guardianIds: [guardianId] })
      .set("content-type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("groupId", groupId);
  });

  it("POST /children invalid body should 400 (missing allergies)", async () => {
    const bad = { firstName: "No", lastName: "Allergy", tenantId };

    const res = await request(app.getHttpServer())
      .post("/children")
      .send(bad)
      .set("content-type", "application/json");

    expect(res.status).toBe(400);
  });

  it("POST /children group from another tenant should 400", async () => {
    // Create another tenant + group
    const other = await prisma.tenant.create({
      data: { name: "Other", slug: `other-${Date.now()}` },
      select: { id: true },
    });
    const otherGroup = await prisma.group.create({
      data: { name: "Older", minAge: 8, maxAge: 10, tenantId: other.id },
      select: { id: true },
    });

    const res = await request(app.getHttpServer())
      .post("/children")
      .send({
        firstName: "Cross",
        lastName: "Tenant",
        allergies: "none",
        tenantId,
        groupId: otherGroup.id, // mismatched tenant
      })
      .set("content-type", "application/json");

    expect(res.status).toBe(400);
  });
});
