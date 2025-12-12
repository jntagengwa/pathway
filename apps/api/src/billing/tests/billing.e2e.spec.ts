import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { BillingModule } from "../billing.module";

describe("Billing (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [BillingModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /billing/checkout should create a checkout session", async () => {
    const res = await request(app.getHttpServer())
      .post("/billing/checkout")
      .set("content-type", "application/json")
      .send({
        provider: "stripe",
        orgId: "11111111-1111-1111-1111-111111111111",
        planCode: "starter",
        successUrl: "https://example.com/success",
        cancelUrl: "https://example.com/cancel",
      });

    expect(res.status).toBe(201); // Nest default for POST
    expect(res.body).toMatchObject({
      provider: "stripe",
      planCode: "starter",
      mode: "subscription",
    });
    expect(res.body.sessionId).toMatch(/^sess_/);
    expect(res.body.checkoutUrl).toContain("success");
  });

  it("POST /billing/checkout invalid payload should 400", async () => {
    const res = await request(app.getHttpServer())
      .post("/billing/checkout")
      .set("content-type", "application/json")
      .send({
        planCode: "starter",
        // missing orgId, successUrl, cancelUrl
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });
});
