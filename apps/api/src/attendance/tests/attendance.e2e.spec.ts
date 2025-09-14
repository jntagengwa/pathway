import { prisma } from "@pathway/db";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../app.module";

const ids = {
  tenant: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  tenant2: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  group: "11111111-1111-1111-1111-111111111111",
  group2: "22222222-2222-2222-2222-222222222222",
  child: "33333333-3333-3333-3333-333333333333",
} as const;

describe("Attendance (e2e)", () => {
  let app: INestApplication;
  let createdId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    // Clean ONLY our fixture data (FK‑safe order + targeted by tenant)
    await prisma.attendance.deleteMany({
      where: {
        OR: [
          { child: { is: { tenantId: { in: [ids.tenant, ids.tenant2] } } } },
          { group: { is: { tenantId: { in: [ids.tenant, ids.tenant2] } } } },
        ],
      },
    });

    await prisma.child.deleteMany({
      where: { tenantId: { in: [ids.tenant, ids.tenant2] } },
    });
    await prisma.group.deleteMany({
      where: { tenantId: { in: [ids.tenant, ids.tenant2] } },
    });
    await prisma.userTenantRole.deleteMany({
      where: { tenantId: { in: [ids.tenant, ids.tenant2] } },
    });
    await prisma.user.deleteMany({
      where: { tenantId: { in: [ids.tenant, ids.tenant2] } },
    });
    await prisma.session
      ?.deleteMany?.({ where: { tenantId: { in: [ids.tenant, ids.tenant2] } } })
      .catch(() => {});
    await prisma.tenant.deleteMany({
      where: { id: { in: [ids.tenant, ids.tenant2] } },
    });

    // Seed tenants
    await prisma.tenant.create({
      data: { id: ids.tenant, name: "Demo Tenant", slug: "demo-tenant" },
    });
    await prisma.tenant.create({
      data: { id: ids.tenant2, name: "Other Tenant", slug: "other-tenant" },
    });

    // Seed groups
    await prisma.group.create({
      data: {
        id: ids.group,
        name: "Kids A",
        tenantId: ids.tenant,
        minAge: 3,
        maxAge: 5,
      },
    });
    await prisma.group.create({
      data: {
        id: ids.group2,
        name: "Kids B",
        tenantId: ids.tenant2,
        minAge: 6,
        maxAge: 8,
      },
    });

    // Seed a child in first tenant
    await prisma.child.create({
      data: {
        id: ids.child,
        firstName: "Sam",
        lastName: "Smith",
        tenantId: ids.tenant,
        groupId: ids.group,
        allergies: "none",
        disabilities: [],
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /attendance should return array", async () => {
    const res = await request(app.getHttpServer()).get("/attendance");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /attendance should create a record", async () => {
    const res = await request(app.getHttpServer())
      .post("/attendance")
      .send({ childId: ids.child, groupId: ids.group, present: true })
      .set("content-type", "application/json");

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
    const res = await request(app.getHttpServer()).get(
      `/attendance/${createdId}`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: createdId,
      childId: ids.child,
      groupId: ids.group,
    });
  });

  it("PATCH /attendance/:id should update present", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/attendance/${createdId}`)
      .send({ present: false })
      .set("content-type", "application/json");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: createdId, present: false });
  });

  it("POST /attendance should 400 when child/group cross-tenant", async () => {
    const res = await request(app.getHttpServer())
      .post("/attendance")
      .send({ childId: ids.child, groupId: ids.group2, present: true })
      .set("content-type", "application/json");

    expect(res.status).toBe(400);
  });
});
