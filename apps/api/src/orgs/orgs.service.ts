import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@pathway/db";
import { registerOrgDto } from "./dto/register-org.dto";
import { BillingService } from "../billing/billing.service";

type RegisterOrgResult = {
  org: {
    id: string;
    name: string;
    slug: string;
    planCode: string;
    isSuite: boolean;
  };
  initialTenant?: {
    id: string;
    name: string;
    slug: string;
    orgId: string;
  };
  admin?: {
    assignedUserId?: string;
    invite?: { email: string; fullName: string };
  };
  billing?: {
    started: boolean;
    provider?: string;
    checkoutUrl?: string;
    sessionId?: string;
  };
};

@Injectable()
export class OrgsService {
  constructor(private readonly billing: BillingService) {}

  /**
   * Register a new Organisation (and optionally its first Tenant).
   * - Validates payload against registerOrgDto
   * - Creates Org (unique slug)
   * - Optionally creates the initial Tenant connected to the Org
   * - Leaves billing/admin bootstrap to follow-up services (hook points noted)
   */
  async register(raw: unknown): Promise<RegisterOrgResult> {
    console.log("[OrgsService] Raw input to register:", raw);
    const dto = await registerOrgDto.parseAsync(raw);
    console.log("[OrgsService] Parsed DTO:", dto);

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1) Create Org
        const org = await tx.org.create({
          data: {
            name: dto.org.name,
            slug: dto.org.slug,
            planCode: dto.org.planCode,
            isSuite: dto.org.isSuite ?? true,
          },
          select: {
            id: true,
            name: true,
            slug: true,
            planCode: true,
            isSuite: true,
          },
        });

        // 2) Optionally create first Tenant
        let createdTenant:
          | { id: string; name: string; slug: string; orgId: string }
          | undefined;
        if (dto.initialTenant?.create) {
          // Safety: name/slug required already by zod refine
          createdTenant = await tx.tenant.create({
            data: {
              name: dto.initialTenant.name as string,
              slug: dto.initialTenant.slug as string,
              org: { connect: { id: org.id } },
            },
            select: { id: true, name: true, slug: true, orgId: true },
          });
        }

        // 3) Admin bootstrap
        let adminOutcome:
          | {
              assignedUserId?: string;
              invite?: { email: string; fullName: string };
            }
          | undefined;

        if (dto.admin.userId) {
          // Assign existing user as Org ADMIN
          try {
            await tx.userOrgRole.create({
              data: {
                userId: dto.admin.userId,
                orgId: org.id,
                // If enum exists, Prisma will coerce; otherwise string is fine
                role: "ADMIN" as unknown as never,
              },
            });
          } catch (err: unknown) {
            // Ignore duplicate if role already exists
            const code =
              typeof err === "object" && err !== null && "code" in err
                ? String((err as { code?: unknown }).code)
                : undefined;
            if (code !== "P2002") throw err;
          }
          adminOutcome = { assignedUserId: dto.admin.userId };
        } else if (dto.admin.email && dto.admin.fullName) {
          // No userId provided — return invite intent; actual invite flow handled elsewhere
          adminOutcome = {
            invite: { email: dto.admin.email, fullName: dto.admin.fullName },
          };
        }

        // 4) Payment bootstrap (via BillingService checkout)
        let billingOutcome:
          | {
              started: boolean;
              provider?: string;
              checkoutUrl?: string;
              sessionId?: string;
            }
          | undefined;
        if (dto.payment) {
          // derive fallback redirect URLs from env if not provided by caller
          const baseUrl = process.env.APP_PUBLIC_URL ?? "https://example.com";
          const successUrl = `${baseUrl}/billing/success`;
          const cancelUrl = `${baseUrl}/billing/cancel`;

          const checkout = await this.billing.checkout({
            provider: dto.payment.provider ?? "stripe",
            orgId: org.id,
            planCode: org.planCode,
            successUrl,
            cancelUrl,
            mode: "subscription",
            seats: 1,
            customerId: dto.payment.customerId,
            paymentMethodId: dto.payment.paymentMethodId,
            trialDays: dto.payment.trialDays,
            billingEmail: dto.org.billingEmail,
          });

          billingOutcome = {
            started: true,
            provider: checkout.provider,
            checkoutUrl: checkout.checkoutUrl,
            sessionId: checkout.sessionId,
          };
        }

        const finalResult = {
          org,
          initialTenant: createdTenant,
          admin: adminOutcome,
          billing: billingOutcome,
        };
        console.log("[OrgsService] Final result:", finalResult);

        return finalResult;
      });

      return result;
    } catch (e: unknown) {
      console.error("[OrgsService] Error in register:", e);
      this.handlePrismaError(e);
    }
  }

  async getBySlug(slug: string, orgId: string) {
    const org = await prisma.org.findFirst({
      where: { slug, id: orgId },
      select: {
        id: true,
        name: true,
        slug: true,
        planCode: true,
        isSuite: true,
      },
    });
    if (!org) throw new NotFoundException("Org not found");
    return org;
  }

  async list(orgId: string) {
    return prisma.org.findMany({
      where: { id: orgId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        planCode: true,
        isSuite: true,
      },
    });
  }

  /**
   * Handoff to billing provider adapter.
   * MVP: no-op; upstream controller or billing module can override/wrap this service later.
   */
  private async bootstrapBilling(): Promise<void> {
    // Intentionally no-op in MVP. Place to call Stripe/GoCardless adapters.
    return;
  }

  private handlePrismaError(e: unknown): never {
    const code =
      typeof e === "object" && e !== null && "code" in e
        ? String((e as { code?: unknown }).code)
        : undefined;
    const message =
      typeof e === "object" &&
      e !== null &&
      "message" in e &&
      typeof (e as { message?: unknown }).message === "string"
        ? (e as { message: string }).message
        : "Unknown error";

    if (code === "P2002") {
      // Unique constraint (likely slug on Org or Tenant)
      throw new ConflictException("Duplicate slug");
    }
    if (code === "P2003") {
      // FK violation (shouldn't happen since we control connects)
      throw new BadRequestException(`Invalid reference: ${message}`);
    }
    if (code === "P2025") {
      throw new NotFoundException("Record not found");
    }
    throw new BadRequestException(`Failed to register org: ${message}`);
  }
}
