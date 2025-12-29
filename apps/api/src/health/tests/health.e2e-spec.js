import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../../app.module";
describe("HealthController (e2e)", () => {
    let app;
    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        app = moduleRef.createNestApplication();
        await app.init();
    });
    afterAll(async () => {
        await app.close();
    });
    it("/health (GET)", async () => {
        const res = await request(app.getHttpServer()).get("/health");
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("status", "ok");
        expect(res.body).toHaveProperty("dbTime");
    });
});
