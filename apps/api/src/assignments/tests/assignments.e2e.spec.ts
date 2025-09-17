import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../app.module";
import { prisma } from "@pathway/db";
import { Role, AssignmentStatus } from "@pathway/db";

// Utility to make unique slugs/names per run
const nonce = Math.random().toString(36).slice(2, 8);

describe("Assignments (e2e)", () => {
  let app: INestApplication;

  // Seeded ids we reuse across tests
  const ids = {
    tenant: undefined as undefined | string,
    group: undefined as undefined | string,
    session: undefined as undefined | string,
    user: undefined as undefined | string,
    assignment: undefined as undefined | string,
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    // --- Seed minimal graph: Tenant -> Group -> Session; User attached to tenant ---
    const tenant = await prisma.tenant.create({
      data: {
        slug: `assignments-e2e-${nonce}`,
        name: `Assignments E2E ${nonce}`,
      },
    });
    ids.tenant = tenant.id;

    const group = await prisma.group.create({
      data: {
        name: `Group-${nonce}`,
        tenantId: tenant.id,
        minAge: 3,
        maxAge: 5,
      },
    });
    ids.group = group.id;

    const session = await prisma.session.create({
      data: {
        tenantId: tenant.id,
        groupId: group.id,
        startsAt: new Date(Date.now() + 60 * 60 * 1000),
        endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      },
    });
    ids.session = session.id;

    const user = await prisma.user.create({
      data: {
        email: `teacher-${nonce}@example.com`,
        name: "Teacher Test",
        tenant: { connect: { id: tenant.id } },
      },
    });
    ids.user = user.id;

    // attach to tenant with TEACHER role via separate create (no nested relation on UserCreateInput)
    await prisma.userTenantRole.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        role: Role.TEACHER,
      },
    });
  });

  afterAll(async () => {
    // Best-effort cleanup of the graph we created
    try {
      await prisma.assignment.deleteMany({ where: { sessionId: ids.session } });
      await prisma.session.deleteMany({ where: { id: ids.session } });
      await prisma.group.deleteMany({ where: { id: ids.group } });
      await prisma.userTenantRole.deleteMany({ where: { userId: ids.user } });
      await prisma.user.deleteMany({ where: { id: ids.user } });
      await prisma.tenant.deleteMany({ where: { id: ids.tenant } });
    } catch {
      // ignore
    }

    await app.close();
  });

  it("POST /assignments should create an assignment", async () => {
    const res = await request(app.getHttpServer())
      .post("/assignments")
      .send({
        sessionId: ids.session,
        userId: ids.user,
        role: Role.TEACHER,
        status: AssignmentStatus.CONFIRMED,
      })
      .set("content-type", "application/json");

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      sessionId: ids.session,
      userId: ids.user,
      role: Role.TEACHER,
      status: AssignmentStatus.CONFIRMED,
    });
    expect(res.body).toHaveProperty("id");

    ids.assignment = res.body.id;
  });

  it("GET /assignments/:id should return the created assignment", async () => {
    const res = await request(app.getHttpServer()).get(
      `/assignments/${ids.assignment}`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: ids.assignment,
      sessionId: ids.session,
      userId: ids.user,
    });
  });

  it("GET /assignments?sessionId=… should list the assignment", async () => {
    const res = await request(app.getHttpServer())
      .get(`/assignments`)
      .query({ sessionId: ids.session });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((a: { id: string }) => a.id === ids.assignment)).toBe(
      true,
    );
  });

  it("PATCH /assignments/:id should update status to DECLINED", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/assignments/${ids.assignment}`)
      .send({ status: AssignmentStatus.DECLINED })
      .set("content-type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", AssignmentStatus.DECLINED);
  });

  it("POST /assignments duplicate (sessionId,userId,role) should 400", async () => {
    const res = await request(app.getHttpServer())
      .post("/assignments")
      .send({ sessionId: ids.session, userId: ids.user, role: Role.TEACHER })
      .set("content-type", "application/json");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });
});
