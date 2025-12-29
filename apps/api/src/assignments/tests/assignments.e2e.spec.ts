import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../app.module";
import { withTenantRlsContext, Role, AssignmentStatus } from "@pathway/db";
import type { PathwayAuthClaims } from "@pathway/auth";
import { requireDatabase } from "../../../test-helpers.e2e";

// Utility to make unique slugs/names per run
const nonce = Math.random().toString(36).slice(2, 8);

describe("Assignments (e2e)", () => {
  let app: INestApplication;
  let authHeader: string;

  // Seeded ids we reuse across tests
  const orgId = process.env.E2E_ORG_ID as string;
  const tenantId = process.env.E2E_TENANT_ID as string;
  const otherTenantId = process.env.E2E_TENANT2_ID as string;
  const ids = {
    tenant: tenantId as string | undefined,
    group: undefined as undefined | string,
    session: undefined as undefined | string,
    user: undefined as undefined | string,
    assignment: undefined as undefined | string,
    otherTenant: otherTenantId as string | undefined,
    otherSession: undefined as undefined | string,
    otherUser: undefined as undefined | string,
    otherAssignment: undefined as undefined | string,
  };

  const buildAuthHeader = (claims: PathwayAuthClaims) => {
    const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
    return `Bearer test.${payload}.sig`;
  };

  beforeAll(async () => {
    if (!requireDatabase()) {
      return;
    }

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    if (!orgId || !tenantId || !otherTenantId) {
      throw new Error("E2E_ORG_ID / E2E_TENANT_ID / E2E_TENANT2_ID missing");
    }

    // Seed tenant A graph within RLS
    await withTenantRlsContext(tenantId, orgId, async (tx) => {
      const group = await tx.group.create({
        data: {
          name: `Group-${nonce}`,
          tenantId,
          minAge: 3,
          maxAge: 5,
        },
      });
      ids.group = group.id;

      const session = await tx.session.create({
        data: {
          tenantId,
          groupId: group.id,
          startsAt: new Date(Date.now() + 60 * 60 * 1000),
          endsAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
      });
      ids.session = session.id;

      const user = await tx.user.create({
        data: {
          email: `teacher-${nonce}@example.com`,
          name: "Teacher Test",
          tenantId,
        },
      });
      ids.user = user.id;

      await tx.userTenantRole.create({
        data: {
          userId: user.id,
          tenantId,
          role: Role.TEACHER,
        },
      });
    });

    // Seed tenant B graph within RLS
    await withTenantRlsContext(otherTenantId, orgId, async (tx) => {
      const otherSession = await tx.session.create({
        data: {
          tenantId: otherTenantId,
          startsAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
          endsAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
        },
      });
      ids.otherSession = otherSession.id;

      const otherUser = await tx.user.create({
        data: {
          email: `teacher-${nonce}-other@example.com`,
          name: "Teacher Other",
          tenantId: otherTenantId,
        },
      });
      ids.otherUser = otherUser.id;

      await tx.userTenantRole.create({
        data: {
          userId: otherUser.id,
          tenantId: otherTenantId,
          role: Role.TEACHER,
        },
      });

      const otherAssignment = await tx.assignment.create({
        data: {
          sessionId: otherSession.id,
          userId: otherUser.id,
          role: Role.TEACHER,
          status: AssignmentStatus.CONFIRMED,
        },
      });
      ids.otherAssignment = otherAssignment.id;
    });

    authHeader = buildAuthHeader({
      sub: "assignments-e2e",
      "https://pathway.app/user": { id: "assignments-e2e" },
      "https://pathway.app/org": {
        orgId,
        slug: "e2e-org",
        name: "E2E Org",
      },
      "https://pathway.app/tenant": {
        tenantId,
        orgId,
        slug: "e2e-tenant-a",
      },
      "https://pathway.app/org_roles": ["org:admin"],
      "https://pathway.app/tenant_roles": ["tenant:admin"],
    });
  });

  afterAll(async () => {
    // Best-effort cleanup of the graph we created
    try {
      await withTenantRlsContext(tenantId, orgId, async (tx) => {
        if (ids.assignment) {
          await tx.assignment.deleteMany({ where: { id: ids.assignment } });
        }
        if (ids.session)
          await tx.session.deleteMany({ where: { id: ids.session } });
        if (ids.group) await tx.group.deleteMany({ where: { id: ids.group } });
        if (ids.user) {
          await tx.userTenantRole.deleteMany({ where: { userId: ids.user } });
          await tx.user.deleteMany({ where: { id: ids.user } });
        }
      });
      await withTenantRlsContext(otherTenantId, orgId, async (tx) => {
        if (ids.otherAssignment) {
          await tx.assignment.deleteMany({
            where: { id: ids.otherAssignment },
          });
        }
        if (ids.otherSession)
          await tx.session.deleteMany({ where: { id: ids.otherSession } });
        if (ids.otherUser) {
          await tx.userTenantRole.deleteMany({
            where: { userId: ids.otherUser },
          });
          await tx.user.deleteMany({ where: { id: ids.otherUser } });
        }
      });
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
      .set("content-type", "application/json")
      .set("Authorization", authHeader);

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
    const res = await request(app.getHttpServer())
      .get(`/assignments/${ids.assignment}`)
      .set("Authorization", authHeader);
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
      .query({ sessionId: ids.session })
      .set("Authorization", authHeader);
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
      .set("content-type", "application/json")
      .set("Authorization", authHeader);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", AssignmentStatus.DECLINED);
  });

  it("POST /assignments duplicate (sessionId,userId,role) should 400", async () => {
    const res = await request(app.getHttpServer())
      .post("/assignments")
      .send({ sessionId: ids.session, userId: ids.user, role: Role.TEACHER })
      .set("content-type", "application/json")
      .set("Authorization", authHeader);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("GET /assignments should not leak other tenant assignments", async () => {
    const res = await request(app.getHttpServer())
      .get("/assignments")
      .set("Authorization", authHeader);

    expect(res.status).toBe(200);
    expect(
      res.body.some(
        (row: { id: string }) => row.id === (ids.otherAssignment as string),
      ),
    ).toBe(false);
  });

  it("GET /assignments/:id should 404 for other tenant assignment", async () => {
    const res = await request(app.getHttpServer())
      .get(`/assignments/${ids.otherAssignment}`)
      .set("Authorization", authHeader);

    expect(res.status).toBe(404);
  });
});
