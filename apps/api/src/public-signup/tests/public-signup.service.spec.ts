import { NotFoundException, BadRequestException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { prisma } from "@pathway/db";
import { PublicSignupService } from "../public-signup.service";
import { MailerService } from "../../mailer/mailer.service";
import { Auth0ManagementService } from "../../auth/auth0-management.service";

jest.mock("@pathway/db", () => {
  const { Role } = jest.requireActual("@prisma/client");
  return {
    Role,
    prisma: {
      publicSignupLink: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      userIdentity: {
        create: jest.fn(),
      },
      userTenantRole: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      child: {
        create: jest.fn(),
      },
      emergencyContact: {
        createMany: jest.fn(),
      },
    parentSignupConsent: {
      create: jest.fn(),
    },
  },
  };
});

describe("PublicSignupService", () => {
  let service: PublicSignupService;
  const mailerMock = { sendParentSignupCompleteEmail: jest.fn() };
  const auth0Mock = { createUser: jest.fn() };

  const validLink = {
    id: "link-1",
    tenantId: "tenant-1",
    orgId: "org-1",
    org: { name: "Test Org" },
    tenant: { name: "Test Site", timezone: "Europe/London" },
  };

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        PublicSignupService,
        { provide: MailerService, useValue: mailerMock },
        { provide: Auth0ManagementService, useValue: auth0Mock },
      ],
    }).compile();

    service = moduleRef.get(PublicSignupService);
    jest.clearAllMocks();
    mailerMock.sendParentSignupCompleteEmail.mockResolvedValue(undefined);
    auth0Mock.createUser.mockResolvedValue("auth0|123");
  });

  describe("resolveLink / getConfig", () => {
    it("throws NotFound when token is invalid", async () => {
      (prisma.publicSignupLink.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(service.getConfig("invalid-token")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("returns config when link is valid", async () => {
      (prisma.publicSignupLink.findFirst as jest.Mock).mockResolvedValue(
        validLink,
      );

      const config = await service.getConfig("any-token");

      expect(config).toMatchObject({
        orgName: "Test Org",
        siteName: "Test Site",
        siteTimezone: "Europe/London",
        formVersion: "1.0",
      });
      expect(config.requiredConsents).toContain("data_processing");
    });
  });

  describe("submit", () => {
    const validDto = {
      token: "a".repeat(32),
      parent: {
        fullName: "Jane Doe",
        email: "jane@example.com",
      },
      emergencyContacts: [
        { name: "Emergency Contact", phone: "07700900123" },
      ],
      children: [
        {
          firstName: "Child",
          lastName: "One",
          photoConsent: false,
        },
      ],
      consents: { dataProcessingConsent: true },
    };

    it("throws when data processing consent is false", async () => {
      (prisma.publicSignupLink.findFirst as jest.Mock).mockResolvedValue(
        validLink,
      );

      await expect(
        service.submit({
          ...validDto,
          consents: { dataProcessingConsent: false },
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("throws when no emergency contacts", async () => {
      (prisma.publicSignupLink.findFirst as jest.Mock).mockResolvedValue(
        validLink,
      );

      await expect(
        service.submit({
          ...validDto,
          emergencyContacts: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it("creates user, children, consents and returns success", async () => {
      (prisma.publicSignupLink.findFirst as jest.Mock).mockResolvedValue(
        validLink,
      );
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: "user-1",
        email: "jane@example.com",
        name: "Jane Doe",
      });
      (prisma.userIdentity.create as jest.Mock).mockResolvedValue({});
      (prisma.userTenantRole.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.userTenantRole.create as jest.Mock).mockResolvedValue({});
      (prisma.child.create as jest.Mock).mockResolvedValue({ id: "child-1" });
      (prisma.emergencyContact.createMany as jest.Mock).mockResolvedValue({});
      (prisma.parentSignupConsent.create as jest.Mock).mockResolvedValue({});
      (prisma.publicSignupLink.update as jest.Mock).mockResolvedValue({});

      const result = await service.submit(validDto);

      expect(result.success).toBe(true);
      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: "jane@example.com",
            name: "Jane Doe",
            displayName: "Jane Doe",
            tenantId: "tenant-1",
            hasFamilyAccess: true,
          }),
        }),
      );
      expect(prisma.child.create).toHaveBeenCalled();
      expect(prisma.emergencyContact.createMany).toHaveBeenCalled();
      expect(prisma.parentSignupConsent.create).toHaveBeenCalled();
    });
  });
});
