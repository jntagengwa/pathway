import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../app.module";
import { prisma } from "@pathway/db";
import { Weekday } from "@pathway/db";

describe("Preferences (e2e)", () => {
  let app: INestApplication;

  // IDs we will create and reuse
  const tenantId = "77777777-7777-7777-7777-777777777777";
  const userId = "88888888-8888-8888-8888-888888888888";
  let prefId = "";

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Use the global pipes configured in AppModule (Zod-based); no class-validator here.
    await app.init();

    // Ensure clean baseline for the specific records we use
    await prisma.volunteerPreference.deleteMany({
      where: { OR: [{ tenantId }, { userId }] },
    });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.tenant.deleteMany({ where: { id: tenantId } });

    // Create a tenant and a user attached to that tenant
    await prisma.tenant.create({
      data: {
        id: tenantId,
        slug: `e2e-pref-${Date.now()}`,
        name: "Pref Tenant",
      },
    });

    // Some schemas require relation writes via `tenant: { connect: { id } }`
    await prisma.user.create({
      data: {
        id: userId,
        email: `pref-user-${Date.now()}@example.com`,
        name: "Pref User",
        tenant: { connect: { id: tenantId } },
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /preferences should create a volunteer preference", async () => {
    const payload = {
      userId,
      tenantId,
      weekday: Weekday.MON,
      startMinute: 9 * 60, // 09:00
      endMinute: 12 * 60, // 12:00
    };

    const res = await request(app.getHttpServer())
      .post("/preferences")
      .send(payload)
      .set("content-type", "application/json");

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      userId,
      tenantId,
      weekday: Weekday.MON,
      startMinute: 540,
      endMinute: 720,
    });
    expect(res.body).toHaveProperty("id");
    prefId = res.body.id;
  });

  it("GET /preferences should return an array including the created preference", async () => {
    const res = await request(app.getHttpServer()).get("/preferences");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find((p: { id: string }) => p.id === prefId);
    expect(found).toBeTruthy();
  });

  it("GET /preferences/:id should return the created preference", async () => {
    const res = await request(app.getHttpServer()).get(
      `/preferences/${prefId}`,
    );
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: prefId,
      userId,
      tenantId,
      weekday: Weekday.MON,
    });
  });

  it("PATCH /preferences/:id should update time window and weekday", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/preferences/${prefId}`)
      .send({
        weekday: Weekday.TUE,
        startMinute: 13 * 60, // 13:00
        endMinute: 15 * 60, // 15:00
      })
      .set("content-type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: prefId,
      weekday: Weekday.TUE,
      startMinute: 780,
      endMinute: 900,
    });
  });

  it("POST /preferences should 400 when endMinute <= startMinute", async () => {
    const bad = await request(app.getHttpServer())
      .post("/preferences")
      .send({
        userId,
        tenantId,
        weekday: Weekday.WED,
        startMinute: 600,
        endMinute: 600,
      })
      .set("content-type", "application/json");

    expect(bad.status).toBe(400);
    expect(bad.body).toHaveProperty("message");
  });

  it("PATCH /preferences/:id with invalid UUID should 400", async () => {
    const res = await request(app.getHttpServer())
      .patch(`/preferences/not-a-uuid`)
      .send({
        weekday: Weekday.FRI,
        startMinute: 8 * 60,
        endMinute: 10 * 60,
      })
      .set("content-type", "application/json");

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("message");
  });

  it("POST /preferences should 400 when minutes are out of range", async () => {
    const badRange = await request(app.getHttpServer())
      .post("/preferences")
      .send({
        userId,
        tenantId,
        weekday: Weekday.THU,
        startMinute: -5, // invalid
        endMinute: 1500, // invalid
      })
      .set("content-type", "application/json");

    expect(badRange.status).toBe(400);
    expect(badRange.body).toHaveProperty("message");
  });

  it("DELETE /preferences/:id should delete the record (then GET 404)", async () => {
    const del = await request(app.getHttpServer()).delete(
      `/preferences/${prefId}`,
    );
    expect(del.status).toBe(200);

    const getAfter = await request(app.getHttpServer()).get(
      `/preferences/${prefId}`,
    );
    expect(getAfter.status).toBe(404);
  });
});
