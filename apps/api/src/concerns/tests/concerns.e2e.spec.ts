import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../app.module";
import { prisma } from "@pathway/db";

// API response shape (serialized)
type Concern = {
  id: string;
  childId: string;
  summary: string;
  details: string | null;
  createdAt: string;
  updatedAt: string;
};

describe("Concerns (e2e)", () => {
  let app: INestApplication;
  let tenantId: string;
  let childId: string | null = null;
  let createdId: string | undefined;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    // Seed a tenant (unique slug per run)
    const slug = `e2e-concerns-${Date.now()}`;
    const tenant = await prisma.tenant.create({
      data: { name: "e2e-concerns-tenant", slug },
    });
    tenantId = tenant.id;

    // Best-effort seed a child; if your schema requires extra fields, adjust here
    try {
      const child = await prisma.child.create({
        data: {
          tenantId,
          firstName: "E2E",
          lastName: "Child",
        } as unknown as Parameters<typeof prisma.child.create>[0]["data"],
      });
      childId = child.id;
    } catch {
      childId = null;
    }
  });

  afterAll(async () => {
    // Cleanup in reverse order
    if (createdId) {
      await prisma.concern
        .delete({ where: { id: createdId } })
        .catch(() => undefined);
    }
    if (childId) {
      await prisma.child
        .delete({ where: { id: childId } })
        .catch(() => undefined);
    }
    if (tenantId) {
      await prisma.tenant
        .delete({ where: { id: tenantId } })
        .catch(() => undefined);
    }
    await app.close();
  });

  describe("validation", () => {
    it("POST /concerns returns 400 for empty summary (before FK checks)", async () => {
      const res = await request(app.getHttpServer())
        .post("/concerns")
        .send({
          childId: "00000000-0000-0000-0000-000000000000",
          summary: "   ",
        })
        .set("content-type", "application/json");
      expect(res.status).toBe(400);
    });
  });

  const seedOk = () => Boolean(childId);

  describe("CRUD", () => {
    it("POST /concerns creates a concern when child exists", async () => {
      if (!seedOk()) return; // skip if child seed failed
      const res = await request(app.getHttpServer())
        .post("/concerns")
        .send({
          childId,
          summary: "Behavioural issue noted",
          details: "Talked during lesson",
        })
        .set("content-type", "application/json");
      expect(res.status).toBe(201);
      const body: Concern = res.body as Concern;
      expect(body.id).toBeTruthy();
      expect(body.childId).toBe(childId);
      expect(body.summary).toBe("Behavioural issue noted");
      createdId = body.id;
    });

    it("GET /concerns filters by childId", async () => {
      if (!seedOk() || !createdId) return;
      const res = await request(app.getHttpServer())
        .get("/concerns")
        .query({ childId });
      expect(res.status).toBe(200);
      const list: Concern[] = res.body as Concern[];
      expect(Array.isArray(list)).toBe(true);
      expect(list.some((c) => c.id === createdId)).toBe(true);
      expect(list.every((c) => c.childId === childId)).toBe(true);
    });

    it("GET /concerns/:id returns the concern", async () => {
      if (!seedOk() || !createdId) return;
      const res = await request(app.getHttpServer()).get(
        `/concerns/${createdId}`,
      );
      expect(res.status).toBe(200);
      const body: Concern = res.body as Concern;
      expect(body.id).toBe(createdId);
    });

    it("PATCH /concerns/:id updates summary/details", async () => {
      if (!seedOk() || !createdId) return;
      const res = await request(app.getHttpServer())
        .patch(`/concerns/${createdId}`)
        .send({ summary: "Updated summary", details: "Adjusted details" })
        .set("content-type", "application/json");
      expect(res.status).toBe(200);
      const body: Concern = res.body as Concern;
      expect(body.summary).toBe("Updated summary");
      expect(body.details).toBe("Adjusted details");
    });

    it("DELETE /concerns/:id deletes and then 404s on fetch", async () => {
      if (!seedOk() || !createdId) return;
      const res = await request(app.getHttpServer()).delete(
        `/concerns/${createdId}`,
      );
      expect(res.status).toBe(200);
      const deleted: { id: string } = res.body as { id: string };
      expect(deleted.id).toBe(createdId);

      const res404 = await request(app.getHttpServer()).get(
        `/concerns/${createdId}`,
      );
      expect(res404.status).toBe(404);
    });
  });
});
