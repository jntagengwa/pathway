import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../app.module";
import { prisma, withTenantRlsContext } from "@pathway/db";
describe("Announcements (e2e)", () => {
    let app;
    const orgId = process.env.E2E_ORG_ID;
    const tenantId = process.env.E2E_TENANT_ID;
    const otherTenantId = process.env.E2E_TENANT2_ID;
    let createdId;
    let authHeader;
    let otherAnnouncementId;
    const buildAuthHeader = (claims) => {
        const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
        return `Bearer test.${payload}.sig`;
    };
    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleRef.createNestApplication();
        await app.init();
        if (!orgId || !tenantId || !otherTenantId) {
            throw new Error("E2E_ORG_ID / E2E_TENANT_ID / E2E_TENANT2_ID missing");
        }
        authHeader = buildAuthHeader({
            sub: "announcements-e2e",
            "https://pathway.app/user": { id: "announcements-e2e" },
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
        // seed announcement in other tenant
        await withTenantRlsContext(otherTenantId, orgId, async (tx) => {
            await tx.announcement.deleteMany({ where: { tenantId: otherTenantId } });
            const otherAnnouncement = await tx.announcement.create({
                data: {
                    tenantId: otherTenantId,
                    title: "Other tenant announcement",
                    body: "Should not be visible",
                    audience: "ALL",
                },
            });
            otherAnnouncementId = otherAnnouncement.id;
        });
    });
    afterAll(async () => {
        await prisma.announcement
            .deleteMany({ where: { tenantId: { in: [tenantId, otherTenantId] } } })
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
                .set("content-type", "application/json")
                .set("Authorization", authHeader);
            expect(res.status).toBe(201);
            const body = res.body;
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
                .set("content-type", "application/json")
                .set("Authorization", authHeader);
            expect(parents.status).toBe(201);
            const staff = await request(app.getHttpServer())
                .post("/announcements")
                .send({
                tenantId,
                title: "For Staff",
                body: "Info for staff",
                audience: "STAFF",
            })
                .set("content-type", "application/json")
                .set("Authorization", authHeader);
            expect(staff.status).toBe(201);
            // Query parents + publishedOnly
            const resParents = await request(app.getHttpServer())
                .get(`/announcements`)
                .query({ audience: "PARENTS", publishedOnly: true })
                .set("Authorization", authHeader);
            expect(resParents.status).toBe(200);
            const listParents = resParents.body;
            expect(Array.isArray(listParents)).toBe(true);
            expect(listParents.length).toBeGreaterThanOrEqual(1);
            expect(listParents.every((a) => a.tenantId === tenantId &&
                a.audience === "PARENTS" &&
                typeof a.publishedAt === "string")).toBe(true);
            // Query all audience (ALL)
            const resAll = await request(app.getHttpServer())
                .get(`/announcements`)
                .query({ audience: "ALL" })
                .set("Authorization", authHeader);
            expect(resAll.status).toBe(200);
            const listAll = resAll.body;
            expect(listAll.every((a) => a.tenantId === tenantId && a.audience === "ALL")).toBe(true);
        });
        it("GET /announcements should not leak other tenant announcements", async () => {
            const res = await request(app.getHttpServer())
                .get(`/announcements`)
                .set("Authorization", authHeader);
            expect(res.status).toBe(200);
            expect(res.body.some((a) => a.id === otherAnnouncementId)).toBe(false);
        });
        it("GET /announcements/:id should return the announcement", async () => {
            const res = await request(app.getHttpServer())
                .get(`/announcements/${createdId}`)
                .set("Authorization", authHeader);
            expect(res.status).toBe(200);
            const body = res.body;
            expect(body.id).toBe(createdId);
        });
        it("GET /announcements/:id should 404 for other tenant", async () => {
            const res = await request(app.getHttpServer())
                .get(`/announcements/${otherAnnouncementId}`)
                .set("Authorization", authHeader);
            expect(res.status).toBe(404);
        });
        it("PATCH /announcements/:id should update fields", async () => {
            const res = await request(app.getHttpServer())
                .patch(`/announcements/${createdId}`)
                .send({
                title: "Welcome Updated",
                audience: "STAFF",
                publishedAt: "2025-01-12",
            })
                .set("content-type", "application/json")
                .set("Authorization", authHeader);
            expect(res.status).toBe(200);
            const body = res.body;
            expect(body.title).toBe("Welcome Updated");
            expect(body.audience).toBe("STAFF");
            expect(typeof body.publishedAt).toBe("string");
            expect(body.publishedAt.startsWith("2025-01-12")).toBe(true);
        });
        it("DELETE /announcements/:id should delete and return the announcement", async () => {
            const res = await request(app.getHttpServer())
                .delete(`/announcements/${createdId}`)
                .set("Authorization", authHeader);
            expect(res.status).toBe(200);
            const body = res.body;
            expect(body.id).toBe(createdId);
            // Verify it no longer exists
            const res404 = await request(app.getHttpServer())
                .get(`/announcements/${createdId}`)
                .set("Authorization", authHeader);
            expect(res404.status).toBe(404);
        });
    });
});
