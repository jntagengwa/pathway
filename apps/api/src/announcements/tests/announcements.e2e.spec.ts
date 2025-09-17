import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../app.module";
import { prisma } from "@pathway/db";

// Types to keep the spec strongly typed (no any)
type Announcement = {
  id: string;
  tenantId: string;
  title: string;
  body: string;
  audience: "ALL" | "PARENTS" | "STAFF";
  publishedAt: string | null; // serialized by Nest/Prisma to ISO string or null
  createdAt: string;
  updatedAt: string;
};

describe("Announcements (e2e)", () => {
  let app: INestApplication;
  let tenantId: string;
  let createdId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();

    // Seed a tenant for FK integrity
    const slug = `e2e-announcements-${Date.now()}`;
    const tenant = await prisma.tenant.create({
      data: { name: "e2e-tenant-announcements", slug },
    });
    tenantId = tenant.id;
  });

  afterAll(async () => {
    // Clean up created tenant cascade if you don't have FK cascade, delete announcements first
    await prisma.announcement
      .deleteMany({ where: { tenantId } })
      .catch(() => undefined);
    await prisma.tenant
      .delete({ where: { id: tenantId } })
      .catch(() => undefined);
    await app.close();
  });

  describe("CRUD", () => {
    it("POST /announcements should create an announcement (default audience ALL)", async () => {
      const res = await request(app.getHttpServer())
        .post("/announcements")
        .send({
          tenantId,
          title: "Welcome",
          body: "We are live!",
          // audience omitted → defaults to ALL
        })
        .set("content-type", "application/json");

      expect(res.status).toBe(201);
      const body: Announcement = res.body as Announcement;
      expect(body.id).toBeTruthy();
      expect(body.tenantId).toBe(tenantId);
      expect(body.audience).toBe("ALL");
      expect(typeof body.createdAt).toBe("string");
      expect(typeof body.updatedAt).toBe("string");
      createdId = body.id;
    });

    it("GET /announcements should filter by tenant and audience & publishedOnly", async () => {
      // Create additional announcements with differing audiences and publishedAt
      const parents = await request(app.getHttpServer())
        .post("/announcements")
        .send({
          tenantId,
          title: "For Parents",
          body: "Info for parents",
          audience: "PARENTS",
          publishedAt: "2025-01-10",
        })
        .set("content-type", "application/json");
      expect(parents.status).toBe(201);

      const staff = await request(app.getHttpServer())
        .post("/announcements")
        .send({
          tenantId,
          title: "For Staff",
          body: "Info for staff",
          audience: "STAFF",
        })
        .set("content-type", "application/json");
      expect(staff.status).toBe(201);

      // Query parents + publishedOnly
      const resParents = await request(app.getHttpServer())
        .get(`/announcements`)
        .query({ tenantId, audience: "PARENTS", publishedOnly: true });

      expect(resParents.status).toBe(200);
      const listParents: Announcement[] = resParents.body as Announcement[];
      expect(Array.isArray(listParents)).toBe(true);
      expect(listParents.length).toBeGreaterThanOrEqual(1);
      expect(
        listParents.every(
          (a) =>
            a.tenantId === tenantId &&
            a.audience === "PARENTS" &&
            typeof a.publishedAt === "string",
        ),
      ).toBe(true);

      // Query all audience (ALL)
      const resAll = await request(app.getHttpServer())
        .get(`/announcements`)
        .query({ tenantId, audience: "ALL" });
      expect(resAll.status).toBe(200);
      const listAll: Announcement[] = resAll.body as Announcement[];
      expect(
        listAll.every((a) => a.tenantId === tenantId && a.audience === "ALL"),
      ).toBe(true);
    });

    it("GET /announcements/:id should return the announcement", async () => {
      const res = await request(app.getHttpServer()).get(
        `/announcements/${createdId}`,
      );
      expect(res.status).toBe(200);
      const body: Announcement = res.body as Announcement;
      expect(body.id).toBe(createdId);
    });

    it("PATCH /announcements/:id should update fields", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/announcements/${createdId}`)
        .send({
          title: "Welcome Updated",
          audience: "STAFF",
          publishedAt: "2025-01-12",
        })
        .set("content-type", "application/json");

      expect(res.status).toBe(200);
      const body: Announcement = res.body as Announcement;
      expect(body.title).toBe("Welcome Updated");
      expect(body.audience).toBe("STAFF");
      expect(typeof body.publishedAt).toBe("string");
      expect((body.publishedAt as string).startsWith("2025-01-12")).toBe(true);
    });

    it("DELETE /announcements/:id should delete and return the announcement", async () => {
      const res = await request(app.getHttpServer()).delete(
        `/announcements/${createdId}`,
      );
      expect(res.status).toBe(200);
      const body: { id: string } = res.body as { id: string };
      expect(body.id).toBe(createdId);

      // Verify it no longer exists
      const res404 = await request(app.getHttpServer()).get(
        `/announcements/${createdId}`,
      );
      expect(res404.status).toBe(404);
    });
  });
});
