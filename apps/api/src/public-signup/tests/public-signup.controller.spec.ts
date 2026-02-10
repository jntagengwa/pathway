import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { PublicSignupController } from "../public-signup.controller";
import { PublicSignupService } from "../public-signup.service";

describe("PublicSignupController", () => {
  let app: Awaited<ReturnType<typeof createApp>>;
  const serviceMock = {
    getConfig: jest.fn(),
    submit: jest.fn(),
  };

  async function createApp() {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PublicSignupController],
      providers: [{ provide: PublicSignupService, useValue: serviceMock }],
    }).compile();

    const application = moduleRef.createNestApplication();
    await application.init();
    return application;
  }

  beforeEach(async () => {
    app = await createApp();
    serviceMock.getConfig.mockReset();
    serviceMock.submit.mockReset();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("GET /public/signup/config", () => {
    it("returns 400 when token is missing", async () => {
      await request(app.getHttpServer())
        .get("/public/signup/config")
        .expect(400);
      expect(serviceMock.getConfig).not.toHaveBeenCalled();
    });

    it("delegates to service and returns config when token provided", async () => {
      const config = {
        orgName: "Test Org",
        siteName: "Test Site",
        siteTimezone: "Europe/London",
        requiredConsents: ["data_processing"],
        formVersion: "1.0",
      };
      serviceMock.getConfig.mockResolvedValue(config);

      const res = await request(app.getHttpServer())
        .get("/public/signup/config?token=abc123token")
        .expect(200);

      expect(serviceMock.getConfig).toHaveBeenCalledWith("abc123token");
      expect(res.body).toEqual(config);
    });
  });

  describe("POST /public/signup/submit", () => {
    const validBody = {
      token: "a".repeat(32),
      parent: { fullName: "Jane Doe", email: "jane@example.com" },
      emergencyContacts: [{ name: "Emergency Contact", phone: "07700900123" }],
      children: [
        {
          firstName: "Child",
          lastName: "One",
          photoConsent: false,
        },
      ],
      consents: { dataProcessingConsent: true },
    };

    it("accepts valid payload and returns success", async () => {
      serviceMock.submit.mockResolvedValue({
        success: true,
        message: "Check your email",
      });

      const res = await request(app.getHttpServer())
        .post("/public/signup/submit")
        .send(validBody)
        .expect(201);

      expect(serviceMock.submit).toHaveBeenCalledWith(validBody);
      expect(res.body.success).toBe(true);
    });

    it("returns 400 when service throws BadRequestException", async () => {
      const body = { ...validBody, consents: { dataProcessingConsent: false } };
      const { BadRequestException } = await import("@nestjs/common");
      serviceMock.submit.mockRejectedValueOnce(new BadRequestException("Data processing consent is required"));

      await request(app.getHttpServer())
        .post("/public/signup/submit")
        .send(body)
        .expect(400);
    });
  });
});
