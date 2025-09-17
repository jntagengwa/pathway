import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../app.module";
import { prisma } from "@pathway/db";

describe("Lessons (e2e)", () => {
  let app: INestApplication;

  const ids = {
    tenant: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
    group: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb",
  };

  const base = {
    title: "Lesson One",
    description: "Intro lesson",
    weekOfISO: "2025-01-06", // Monday
    fileKey: "uploads/lesson-one.pdf",
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Seed minimal graph
    await prisma.tenant.create({
      data: { id: ids.tenant, name: "Lessons Tenant", slug: "lessons-tenant" },
    });

    await prisma.group.create({
      data: {
        id: ids.group,
        name: "Bluebirds",
        tenantId: ids.tenant,
        minAge: 5,
        maxAge: 7,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe("CRUD", () => {
    let createdId: string;

    it("POST /lessons should create a lesson", async () => {
      const res = await request(app.getHttpServer())
        .post("/lessons")
        .send({
          tenantId: ids.tenant,
          groupId: ids.group,
          title: base.title,
          description: base.description,
          fileKey: base.fileKey,
          weekOf: base.weekOfISO,
        })
        .set("content-type", "application/json");

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        tenantId: ids.tenant,
        groupId: ids.group,
        title: base.title,
        description: base.description,
        fileKey: base.fileKey,
      });
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("weekOf");
      expect(typeof res.body.weekOf).toBe("string");
      expect((res.body.weekOf as string).startsWith(base.weekOfISO)).toBe(true);
      createdId = res.body.id;
    });

    it("GET /lessons/:id should return the created lesson", async () => {
      const res = await request(app.getHttpServer()).get(
        `/lessons/${createdId}`,
      );
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: createdId,
        tenantId: ids.tenant,
        groupId: ids.group,
        title: base.title,
      });
    });

    it("GET /lessons should filter by tenantId/groupId/weekOf", async () => {
      const res = await request(app.getHttpServer()).get(
        `/lessons?tenantId=${ids.tenant}&groupId=${ids.group}&weekOf=${base.weekOfISO}`,
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(
        res.body.every(
          (l: { tenantId: string; groupId: string; weekOf: string }) =>
            l.tenantId === ids.tenant &&
            l.groupId === ids.group &&
            typeof l.weekOf === "string" &&
            l.weekOf.startsWith(base.weekOfISO),
        ),
      ).toBe(true);
    });

    it("PATCH /lessons/:id should update fields", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/lessons/${createdId}`)
        .send({
          title: "Lesson One (Updated)",
          description: "Updated desc",
          weekOf: "2025-01-13", // next week
        })
        .set("content-type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: createdId,
        title: "Lesson One (Updated)",
        description: "Updated desc",
      });
      expect(typeof res.body.weekOf).toBe("string");
      expect((res.body.weekOf as string).startsWith("2025-01-13")).toBe(true);
    });

    it("DELETE /lessons/:id should delete and return the lesson", async () => {
      const res = await request(app.getHttpServer()).delete(
        `/lessons/${createdId}`,
      );
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("id", createdId);

      const gone = await prisma.lesson.findUnique({ where: { id: createdId } });
      expect(gone).toBeNull();
    });
  });

  describe("Validation", () => {
    it("POST /lessons should 400 for invalid uuids", async () => {
      const res = await request(app.getHttpServer())
        .post("/lessons")
        .send({
          tenantId: "not-a-uuid",
          title: "Bad",
          weekOf: base.weekOfISO,
        })
        .set("content-type", "application/json");

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("POST /lessons should 400 for invalid weekOf", async () => {
      const res = await request(app.getHttpServer())
        .post("/lessons")
        .send({
          tenantId: ids.tenant,
          title: "Bad Date",
          weekOf: "not-a-date",
        })
        .set("content-type", "application/json");

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("PATCH /lessons/:id should 400 for invalid id", async () => {
      const res = await request(app.getHttpServer())
        .patch("/lessons/not-a-uuid")
        .send({ title: "won't matter" })
        .set("content-type", "application/json");

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });
  });
});
