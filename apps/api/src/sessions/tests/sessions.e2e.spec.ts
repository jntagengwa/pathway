import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../app.module";
import { prisma } from "@pathway/db";
import { randomUUID } from "crypto";

describe("Sessions (e2e)", () => {
  let app: INestApplication;

  const uniq = Date.now().toString();

  let ids: {
    tenant: string;
    group: string;
    session: string;
    otherTenant: string;
    otherGroup: string;
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    ids = {
      tenant: randomUUID(),
      group: randomUUID(),
      session: randomUUID(),
      otherTenant: randomUUID(),
      otherGroup: randomUUID(),
    };

    // Clean tables in FK-safe order (avoid TRUNCATE deadlocks)
    await prisma.attendance.deleteMany({});
    await prisma.assignment.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.childNote.deleteMany({});
    await prisma.concern.deleteMany({});
    await prisma.child.deleteMany({});
    await prisma.group.deleteMany({});
    await prisma.userTenantRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // Seed base tenants
    await prisma.tenant.create({
      data: {
        id: ids.tenant,
        name: "Demo Tenant",
        slug: `demo-tenant-${uniq}`,
      },
    });
    await prisma.tenant.create({
      data: {
        id: ids.otherTenant,
        name: "Other Tenant",
        slug: `other-tenant-${uniq}`,
      },
    });

    // Seed groups
    await prisma.group.create({
      data: {
        id: ids.group,
        name: "5-6s",
        tenantId: ids.tenant,
        minAge: 5,
        maxAge: 6,
      },
    });
    await prisma.group.create({
      data: {
        id: ids.otherGroup,
        name: "7-8s",
        tenantId: ids.otherTenant,
        minAge: 7,
        maxAge: 8,
      },
    });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it("GET /sessions should return array", async () => {
    const res = await request(app.getHttpServer()).get("/sessions");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /sessions should create a session", async () => {
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000); // +1h

    const res = await request(app.getHttpServer())
      .post("/sessions")
      .send({
        tenantId: ids.tenant,
        groupId: ids.group,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        title: "Sunday 10am",
      })
      .set("content-type", "application/json");

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      tenantId: ids.tenant,
      groupId: ids.group,
      title: "Sunday 10am",
    });
    expect(res.body).toHaveProperty("id");
  });

  it("GET /sessions/:id should return the created session", async () => {
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

    const created = await prisma.session.create({
      data: {
        id: ids.session,
        tenantId: ids.tenant,
        groupId: ids.group,
        startsAt,
        endsAt,
        title: "9am Gathering",
      },
    });

    const res = await request(app.getHttpServer()).get(
      `/sessions/${created.id}`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: created.id,
      tenantId: ids.tenant,
      groupId: ids.group,
      title: "9am Gathering",
    });
  });

  it("PATCH /sessions/:id should update a session", async () => {
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
    const created = await prisma.session.create({
      data: {
        tenantId: ids.tenant,
        groupId: ids.group,
        startsAt,
        endsAt,
        title: "Original",
      },
    });

    const res = await request(app.getHttpServer())
      .patch(`/sessions/${created.id}`)
      .send({ title: "Updated Title" })
      .set("content-type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: created.id,
      title: "Updated Title",
    });
  });

  it("POST /sessions should 400 when endsAt <= startsAt (validation)", async () => {
    const now = new Date();
    const res = await request(app.getHttpServer())
      .post("/sessions")
      .send({
        tenantId: ids.tenant,
        groupId: ids.group,
        startsAt: now.toISOString(),
        endsAt: new Date(now.getTime() - 1000).toISOString(), // ends before starts
        title: "Invalid",
      })
      .set("content-type", "application/json");

    expect(res.status).toBe(400);
  });

  it("POST /sessions should 400 when group is from another tenant", async () => {
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

    const res = await request(app.getHttpServer())
      .post("/sessions")
      .send({
        tenantId: ids.tenant,
        groupId: ids.otherGroup, // mismatched tenant
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        title: "Cross-tenant",
      })
      .set("content-type", "application/json");

    expect(res.status).toBe(400);
  });
});
