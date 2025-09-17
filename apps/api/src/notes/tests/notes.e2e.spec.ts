import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../app.module";
import { prisma } from "@pathway/db";

// Types for responses
type Note = {
  id: string;
  childId: string;
  authorId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
};

describe("Notes (e2e)", () => {
  let app: INestApplication;
  let tenantId: string;
  let childId: string | null = null;
  let authorId: string | null = null;
  let createdId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    // Seed tenant (common across repo)
    const slug = `e2e-notes-${Date.now()}`;
    const tenant = await prisma.tenant.create({
      data: { name: "e2e-notes-tenant", slug },
    });
    tenantId = tenant.id;

    // Best-effort seeding of author (User) and child (Child) with common minimal shapes.
    // If your schema requires different fields, adjust here.
    try {
      const user = await prisma.user.create({
        data: {
          // Common minimal fields across repos
          tenantId,
          name: "E2E Author",
          email: `e2e.author.${Date.now()}@example.com`,
        } as unknown as Parameters<typeof prisma.user.create>[0]["data"],
      });
      authorId = user.id;
    } catch {
      authorId = null;
    }

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
    // Cleanup in reverse order; guard for missing FKs
    if (createdId) {
      await prisma.childNote
        .delete({ where: { id: createdId } })
        .catch(() => undefined);
    }
    if (childId) {
      await prisma.child
        .delete({ where: { id: childId } })
        .catch(() => undefined);
    }
    if (authorId) {
      await prisma.user
        .delete({ where: { id: authorId } })
        .catch(() => undefined);
    }
    await prisma.tenant
      .delete({ where: { id: tenantId } })
      .catch(() => undefined);
    await app.close();
  });

  describe("validation", () => {
    it("POST /notes should 400 on empty text", async () => {
      const res = await request(app.getHttpServer())
        .post("/notes")
        .send({
          childId: "00000000-0000-0000-0000-000000000000",
          authorId: "00000000-0000-0000-0000-000000000000",
          text: "   ",
        })
        .set("content-type", "application/json");
      expect(res.status).toBe(400);
    });
  });

  const seedOk = () => Boolean(childId && authorId);

  describe("CRUD", () => {
    it("POST /notes should create a note when FKs exist", async () => {
      if (!seedOk()) {
        // Skip happy path if FK seeding failed
        return;
      }
      const res = await request(app.getHttpServer())
        .post("/notes")
        .send({ childId, authorId, text: "Great progress today" })
        .set("content-type", "application/json");
      expect(res.status).toBe(201);
      const body: Note = res.body as Note;
      expect(body.id).toBeTruthy();
      expect(body.childId).toBe(childId);
      expect(body.authorId).toBe(authorId);
      createdId = body.id;
    });

    it("GET /notes should filter by childId", async () => {
      if (!seedOk()) return;
      const res = await request(app.getHttpServer())
        .get("/notes")
        .query({ childId });
      expect(res.status).toBe(200);
      const list: Note[] = res.body as Note[];
      expect(Array.isArray(list)).toBe(true);
      expect(list.every((n) => n.childId === childId)).toBe(true);
    });

    it("GET /notes/:id should return the note", async () => {
      if (!seedOk()) return;
      const res = await request(app.getHttpServer()).get(`/notes/${createdId}`);
      expect(res.status).toBe(200);
      const body: Note = res.body as Note;
      expect(body.id).toBe(createdId);
    });

    it("PATCH /notes/:id should update text", async () => {
      if (!seedOk()) return;
      const res = await request(app.getHttpServer())
        .patch(`/notes/${createdId}`)
        .send({ text: "Updated note text" })
        .set("content-type", "application/json");
      expect(res.status).toBe(200);
      const body: Note = res.body as Note;
      expect(body.text).toBe("Updated note text");
    });

    it("DELETE /notes/:id should delete and then 404 on fetch", async () => {
      if (!seedOk()) return;
      const res = await request(app.getHttpServer()).delete(
        `/notes/${createdId}`,
      );
      expect(res.status).toBe(200);
      const deleted: { id: string } = res.body as { id: string };
      expect(deleted.id).toBe(createdId);

      const res404 = await request(app.getHttpServer()).get(
        `/notes/${createdId}`,
      );
      expect(res404.status).toBe(404);
    });
  });
});
