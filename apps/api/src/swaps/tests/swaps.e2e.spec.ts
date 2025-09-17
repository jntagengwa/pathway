import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../app.module";
import { prisma } from "@pathway/db";
import { AssignmentStatus, Role, SwapStatus } from "@pathway/db";

// E2E for Swap Requests
// This follows the same conventions as other e2e suites in this repo

describe("Swaps (e2e)", () => {
  let app: INestApplication;

  const ids = {
    tenant: "99999999-9999-4999-9999-999999999999",
    userFrom: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
    userTo: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
    session: "11111111-1111-4111-9111-111111111111",
    assignment: "22222222-2222-4222-9222-222222222222",
  } as const;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(async () => {
    // FK-safe cleanup similar to other suites
    await prisma.attendance.deleteMany({});
    await prisma.swapRequest.deleteMany({});
    await prisma.assignment.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.childNote.deleteMany({});
    await prisma.concern.deleteMany({});
    await prisma.child.deleteMany({});
    await prisma.group.deleteMany({});
    await prisma.volunteerPreference?.deleteMany?.({}).catch(() => undefined);
    await prisma.userTenantRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // Seed minimal graph: tenant, two users, a session, one assignment
    await prisma.tenant.create({
      data: { id: ids.tenant, slug: "swaps-e2e", name: "Swaps E2E Tenant" },
    });

    await prisma.user.create({
      data: {
        id: ids.userFrom,
        email: "from@example.com",
        name: "From User",
        tenant: { connect: { id: ids.tenant } },
      },
    });
    await prisma.userTenantRole.create({
      data: { userId: ids.userFrom, tenantId: ids.tenant, role: Role.TEACHER },
    });

    await prisma.user.create({
      data: {
        id: ids.userTo,
        email: "to@example.com",
        name: "To User",
        tenant: { connect: { id: ids.tenant } },
      },
    });
    await prisma.userTenantRole.create({
      data: { userId: ids.userTo, tenantId: ids.tenant, role: Role.TEACHER },
    });

    await prisma.session.create({
      data: {
        id: ids.session,
        tenantId: ids.tenant,
        startsAt: new Date("2025-01-01T15:00:00.000Z"),
        endsAt: new Date("2025-01-01T16:00:00.000Z"),
      },
    });

    await prisma.assignment.create({
      data: {
        id: ids.assignment,
        sessionId: ids.session,
        userId: ids.userFrom,
        role: Role.TEACHER,
        status: AssignmentStatus.CONFIRMED,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /swaps should create a swap request", async () => {
    const res = await request(app.getHttpServer())
      .post("/swaps")
      .send({
        assignmentId: ids.assignment,
        fromUserId: ids.userFrom,
      })
      .set("content-type", "application/json");

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      assignmentId: ids.assignment,
      fromUserId: ids.userFrom,
      status: SwapStatus.REQUESTED,
    });
    expect(res.body).toHaveProperty("id");
  });

  it("GET /swaps/:id should return the created swap", async () => {
    const created = await prisma.swapRequest.create({
      data: {
        assignmentId: ids.assignment,
        fromUserId: ids.userFrom,
        status: SwapStatus.REQUESTED,
      },
    });

    const res = await request(app.getHttpServer()).get(`/swaps/${created.id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: created.id });
  });

  it("GET /swaps should filter by fromUserId and status", async () => {
    // one requested
    await prisma.swapRequest.create({
      data: {
        assignmentId: ids.assignment,
        fromUserId: ids.userFrom,
        status: SwapStatus.REQUESTED,
      },
    });
    // one declined
    await prisma.swapRequest.create({
      data: {
        assignmentId: ids.assignment,
        fromUserId: ids.userFrom,
        status: SwapStatus.DECLINED,
      },
    });

    const res = await request(app.getHttpServer()).get(
      `/swaps?fromUserId=${ids.userFrom}&status=${SwapStatus.REQUESTED}`,
    );

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(
      res.body.every(
        (r: { fromUserId: string; status: SwapStatus }) =>
          r.fromUserId === ids.userFrom && r.status === SwapStatus.REQUESTED,
      ),
    ).toBe(true);
  });

  it("PATCH /swaps/:id should accept a swap when toUserId supplied", async () => {
    const created = await prisma.swapRequest.create({
      data: {
        assignmentId: ids.assignment,
        fromUserId: ids.userFrom,
        status: SwapStatus.REQUESTED,
      },
    });

    const res = await request(app.getHttpServer())
      .patch(`/swaps/${created.id}`)
      .send({ status: SwapStatus.ACCEPTED, toUserId: ids.userTo })
      .set("content-type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: created.id,
      status: SwapStatus.ACCEPTED,
      toUserId: ids.userTo,
    });
  });

  it("PATCH /swaps/:id should 400 if accepting without toUserId", async () => {
    const created = await prisma.swapRequest.create({
      data: {
        assignmentId: ids.assignment,
        fromUserId: ids.userFrom,
        status: SwapStatus.REQUESTED,
      },
    });

    const res = await request(app.getHttpServer())
      .patch(`/swaps/${created.id}`)
      .send({ status: SwapStatus.ACCEPTED })
      .set("content-type", "application/json");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("DELETE /swaps/:id should delete and return the swap", async () => {
    const created = await prisma.swapRequest.create({
      data: {
        assignmentId: ids.assignment,
        fromUserId: ids.userFrom,
        status: SwapStatus.REQUESTED,
      },
    });

    const res = await request(app.getHttpServer()).delete(
      `/swaps/${created.id}`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: created.id });

    const gone = await prisma.swapRequest.findUnique({
      where: { id: created.id },
    });
    expect(gone).toBeNull();
  });

  it("POST /swaps should 400 for invalid UUIDs", async () => {
    const bad = await request(app.getHttpServer())
      .post("/swaps")
      .send({ assignmentId: "not-a-uuid", fromUserId: "also-bad" })
      .set("content-type", "application/json");

    expect(bad.status).toBe(400);
    expect(bad.body).toHaveProperty("message");
  });

  it("PATCH /swaps/:id should 404 for unknown id", async () => {
    const res = await request(app.getHttpServer())
      .patch("/swaps/00000000-0000-4000-8000-000000000000")
      .send({ status: SwapStatus.CANCELLED })
      .set("content-type", "application/json");

    expect(res.status).toBe(404);
  });
});
