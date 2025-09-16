import { prisma } from "@pathway/db";
import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../app.module";

const ids = {
  group: "11111111-1111-1111-1111-111111111111",
  group2: "22222222-2222-2222-2222-222222222222",
  child: "33333333-3333-3333-3333-333333333333",
} as const;

const nonce = Date.now();

const TENANT_A_ID = process.env.E2E_TENANT_ID;
const TENANT_B_ID = process.env.E2E_TENANT2_ID;

if (!TENANT_A_ID || !TENANT_B_ID) {
  throw new Error(
    "E2E_TENANT_ID / E2E_TENANT2_ID are missing. Ensure test.setup.e2e.ts seeds tenants and exports their IDs.",
  );
}

describe("Attendance (e2e)", () => {
  let app: INestApplication;
  let createdId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    // Minimal, ID-scoped cleanup to avoid cross-suite FK issues
    // 1) Wipe attendance tied to our fixture ids
    await prisma.attendance.deleteMany({
      where: {
        OR: [
          { childId: ids.child },
          { groupId: { in: [ids.group, ids.group2] } },
        ],
      },
    });

    // 2) Remove child & groups if they exist
    await prisma.child.deleteMany({ where: { id: ids.child } });
    await prisma.group.deleteMany({
      where: { id: { in: [ids.group, ids.group2] } },
    });

    // 4) Upsert groups under their respective tenants
    await prisma.group.upsert({
      where: { id: ids.group },
      update: {},
      create: {
        id: ids.group,
        name: `Kids A ${nonce}` as string,
        tenantId: TENANT_A_ID,
        minAge: 3,
        maxAge: 5,
      },
    });
    await prisma.group.upsert({
      where: { id: ids.group2 },
      update: {},
      create: {
        id: ids.group2,
        name: `Kids B ${nonce}` as string,
        tenantId: TENANT_B_ID,
        minAge: 6,
        maxAge: 8,
      },
    });

    // 5) Upsert child in first tenant
    await prisma.child.upsert({
      where: { id: ids.child },
      update: {},
      create: {
        id: ids.child,
        firstName: "Sam",
        lastName: "Smith",
        tenantId: TENANT_A_ID,
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
