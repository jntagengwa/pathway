import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "crypto";
import { prisma, Role } from "@pathway/db";
import { Inject } from "@nestjs/common";
import { MailerService } from "../mailer/mailer.service";
import { Auth0ManagementService } from "../auth/auth0-management.service";
import type { PublicSignupConfigDto } from "./dto/public-signup-config.dto";
import type {
  PublicSignupSubmitDto,
  EmergencyContactDto,
} from "./dto/public-signup-submit.dto";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const FORM_VERSION = "1.0";
const REQUIRED_CONSENTS = ["data_processing", "photo_per_child", "emergency_contact"];

type ResolvedLink = {
  id: string;
  tenantId: string;
  orgId: string;
  orgName: string;
  siteName: string;
  siteTimezone: string | null;
};

@Injectable()
export class PublicSignupService {
  constructor(
    @Inject(MailerService) private readonly mailerService: MailerService,
    @Inject(Auth0ManagementService)
    private readonly auth0Management: Auth0ManagementService,
  ) {}

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  /**
   * Resolve and validate token; returns link context or throws.
   */
  async resolveLink(token: string): Promise<ResolvedLink> {
    const tokenHash = this.hashToken(token);
    const link = await prisma.publicSignupLink.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        tenant: { select: { name: true, timezone: true } },
        org: { select: { name: true } },
      },
    });

    if (!link) {
      throw new NotFoundException("Invalid or expired signup link");
    }

    return {
      id: link.id,
      tenantId: link.tenantId,
      orgId: link.orgId,
      orgName: link.org.name,
      siteName: link.tenant.name,
      siteTimezone: link.tenant.timezone ?? null,
    };
  }

  async getConfig(token: string): Promise<PublicSignupConfigDto> {
    const link = await this.resolveLink(token);
    return {
      orgName: link.orgName,
      siteName: link.siteName,
      siteTimezone: link.siteTimezone,
      requiredConsents: REQUIRED_CONSENTS,
      formVersion: FORM_VERSION,
    };
  }

  async submit(dto: PublicSignupSubmitDto): Promise<{ success: true; message: string }> {
    const link = await this.resolveLink(dto.token);

    if (!dto.consents.dataProcessingConsent) {
      throw new BadRequestException("Data processing consent is required");
    }
    if (!dto.emergencyContacts?.length) {
      throw new BadRequestException("At least one emergency contact is required");
    }
    if (!dto.children?.length) {
      throw new BadRequestException("At least one child is required");
    }

    for (const child of dto.children) {
      if ((child.photoBase64 || child.photoContentType) && !child.photoConsent) {
        throw new BadRequestException(
          "Photo can only be set when photo consent is granted for that child",
        );
      }
    }

    const email = dto.parent.email.trim().toLowerCase();
    const fullName = dto.parent.fullName.trim();
    const safeName = fullName && !fullName.includes("@") ? fullName : null;

    let user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: safeName ?? fullName,
          displayName: safeName ?? fullName,
          tenantId: link.tenantId,
          hasFamilyAccess: true,
        },
      });

      const auth0UserId = await this.auth0Management.createUser({
        email,
        password: dto.parent.password,
        name: safeName ?? fullName,
        emailVerified: false,
      });

      if (auth0UserId) {
        await prisma.userIdentity.create({
          data: {
            userId: user.id,
            provider: "auth0",
            providerSubject: auth0UserId,
            email,
            displayName: safeName ?? fullName,
          },
        });
      }
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: safeName ?? user.name ?? fullName,
          displayName: safeName ?? user.displayName ?? fullName,
          tenantId: link.tenantId,
          hasFamilyAccess: true,
        },
      });
    }

    const existingRole = await prisma.userTenantRole.findFirst({
      where: { userId: user.id, tenantId: link.tenantId, role: Role.PARENT },
    });
    if (!existingRole) {
      await prisma.userTenantRole.create({
        data: {
          userId: user.id,
          tenantId: link.tenantId,
          role: Role.PARENT,
        },
      });
    }

    const now = new Date();
    const childIds: string[] = [];

    for (const c of dto.children) {
      const allergies = (c.allergies ?? "").trim() || "none";
      let photoBytes: Buffer | null = null;
      let photoContentType: string | null = null;
      if (c.photoConsent && c.photoBase64?.trim()) {
        const decoded = this.decodeAndValidatePhoto(
          c.photoBase64.trim(),
          c.photoContentType?.trim(),
        );
        photoBytes = decoded.buffer;
        photoContentType = decoded.contentType;
      }

      const dateOfBirth =
        c.dateOfBirth?.trim() && /^\d{4}-\d{2}-\d{2}$/.test(c.dateOfBirth.trim())
          ? new Date(c.dateOfBirth.trim())
          : null;

      const child = await prisma.child.create({
        data: {
          tenantId: link.tenantId,
          firstName: c.firstName.trim(),
          lastName: c.lastName.trim(),
          preferredName: c.preferredName?.trim() || null,
          dateOfBirth,
          allergies,
          additionalNeedsNotes: c.additionalNeedsNotes?.trim() || null,
          schoolName: c.schoolName?.trim() || null,
          yearGroup: c.yearGroup?.trim() || null,
          gpName: c.gpName?.trim() || null,
          gpPhone: c.gpPhone?.trim() || null,
          specialNeedsType: c.specialNeedsType?.trim() || null,
          specialNeedsOther:
            c.specialNeedsType === "other" && c.specialNeedsOther?.trim()
              ? c.specialNeedsOther.trim()
              : null,
          photoConsent: c.photoConsent,
          photoKey: null,
          photoBytes: photoBytes ?? undefined,
          photoContentType: photoContentType ?? undefined,
          groupId: c.groupId || null,
          guardians: { connect: { id: user.id } },
        },
      });
      childIds.push(child.id);
    }

    await prisma.emergencyContact.createMany({
      data: dto.emergencyContacts.map((ec: EmergencyContactDto) => ({
        userId: user!.id,
        tenantId: link.tenantId,
        name: ec.name.trim(),
        phone: ec.phone.trim(),
        relationship: ec.relationship?.trim() || null,
      })),
    });

    await prisma.parentSignupConsent.create({
      data: {
        userId: user.id,
        tenantId: link.tenantId,
        dataProcessingConsentAt: now,
        firstAidConsentAt: dto.consents.firstAidConsent ? now : null,
        consentingAdultName: fullName,
        consentingAdultRelationship: dto.parent.relationshipToChild?.trim() || null,
      },
    });

    await prisma.publicSignupLink.update({
      where: { id: link.id },
      data: { lastUsedAt: now },
    });

    const adminUrl = process.env.ADMIN_URL || "https://app.nexsteps.dev";
    try {
      await this.mailerService.sendParentSignupCompleteEmail({
        to: email,
        parentName: fullName,
        siteName: link.siteName,
        orgName: link.orgName,
        loginUrl: `${adminUrl}/login`,
      });
    } catch {
      // Do not fail submit if email fails
    }

    return {
      success: true,
      message: "Registration complete. Check your email to sign in.",
    };
  }

  /**
   * Decode base64 photo, validate size and type. Returns buffer and contentType for DB storage.
   */
  private decodeAndValidatePhoto(
    photoBase64: string,
    contentType?: string | null,
  ): { buffer: Buffer; contentType: string } {
    let data = photoBase64;
    let detectedType = contentType;
    if (data.startsWith("data:")) {
      const match = data.match(/^data:([^;]+);base64,/);
      if (match) {
        detectedType = match[1].trim().toLowerCase();
        data = data.replace(/^data:[^;]+;base64,/, "");
      }
    }
    const buffer = Buffer.from(data, "base64");
    if (buffer.length > MAX_PHOTO_BYTES) {
      throw new BadRequestException(
        `Photo must be at most ${MAX_PHOTO_BYTES / 1024 / 1024}MB`,
      );
    }
    if (buffer.length === 0) {
      throw new BadRequestException("Photo data is empty");
    }
    const type = detectedType || "image/jpeg";
    if (!ALLOWED_PHOTO_TYPES.includes(type)) {
      throw new BadRequestException(
        `Photo must be one of: ${ALLOWED_PHOTO_TYPES.join(", ")}`,
      );
    }
    return { buffer, contentType: type };
  }
}
