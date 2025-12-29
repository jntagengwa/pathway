var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OrgsService_1;
import { BadRequestException, ConflictException, Injectable, NotFoundException, } from "@nestjs/common";
import { prisma } from "@pathway/db";
import { registerOrgDto } from "./dto/register-org.dto";
import { BillingService } from "../billing/billing.service";
import { LoggingService, } from "../common/logging/logging.service";
import { Logger } from "@nestjs/common";
let OrgsService = OrgsService_1 = class OrgsService {
    billing;
    logger;
    constructor(billing, logging) {
        this.billing = billing;
        // Fallback to Nest Logger if DI fails in dev; avoids crash during bootstrap.
        this.logger = logging
            ? logging.createLogger(OrgsService_1.name)
            : createLoggerFallback(OrgsService_1.name);
    }
    /**
     * Register a new Organisation (and optionally its first Tenant).
     * - Validates payload against registerOrgDto
     * - Creates Org (unique slug)
     * - Optionally creates the initial Tenant connected to the Org
     * - Leaves billing/admin bootstrap to follow-up services (hook points noted)
     */
    async register(raw) {
        const dto = await registerOrgDto.parseAsync(raw);
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
                let createdTenant;
                if (dto.initialTenant?.create) {
                    // Safety: name/slug required already by zod refine
                    createdTenant = await tx.tenant.create({
                        data: {
                            name: dto.initialTenant.name,
                            slug: dto.initialTenant.slug,
                            org: { connect: { id: org.id } },
                        },
                        select: { id: true, name: true, slug: true, orgId: true },
                    });
                }
                // 3) Admin bootstrap
                let adminOutcome;
                if (dto.admin.userId) {
                    // Assign existing user as Org ADMIN
                    try {
                        await tx.userOrgRole.create({
                            data: {
                                userId: dto.admin.userId,
                                orgId: org.id,
                                // If enum exists, Prisma will coerce; otherwise string is fine
                                role: "ADMIN",
                            },
                        });
                    }
                    catch (err) {
                        // Ignore duplicate if role already exists
                        const code = typeof err === "object" && err !== null && "code" in err
                            ? String(err.code)
                            : undefined;
                        if (code !== "P2002")
                            throw err;
                    }
                    adminOutcome = { assignedUserId: dto.admin.userId };
                }
                else if (dto.admin.email && dto.admin.fullName) {
                    // No userId provided — return invite intent; actual invite flow handled elsewhere
                    adminOutcome = {
                        invite: { email: dto.admin.email, fullName: dto.admin.fullName },
                    };
                }
                // 4) Payment bootstrap (via BillingService checkout)
                let billingOutcome;
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
                return {
                    org,
                    initialTenant: createdTenant,
                    admin: adminOutcome,
                    billing: billingOutcome,
                };
            });
            return result;
        }
        catch (e) {
            this.logger.error("Failed to register org", {
                orgSlug: dto.org?.slug,
                code: typeof e === "object" && e !== null && "code" in e
                    ? e.code ?? "unknown"
                    : "unknown",
            });
            this.handlePrismaError(e);
        }
    }
    async getBySlug(slug, orgId) {
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
        if (!org)
            throw new NotFoundException("Org not found");
        return org;
    }
    async list(orgId) {
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
    async bootstrapBilling() {
        // Intentionally no-op in MVP. Place to call Stripe/GoCardless adapters.
        return;
    }
    handlePrismaError(e) {
        const code = typeof e === "object" && e !== null && "code" in e
            ? String(e.code)
            : undefined;
        const message = typeof e === "object" &&
            e !== null &&
            "message" in e &&
            typeof e.message === "string"
            ? e.message
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
};
OrgsService = OrgsService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [BillingService,
        LoggingService])
], OrgsService);
export { OrgsService };
function createLoggerFallback(component) {
    const nest = new Logger(component);
    return {
        info: (message, meta) => nest.log(meta ? { message, ...meta } : message),
        warn: (message, meta) => nest.warn(meta ? { message, ...meta } : message),
        error: (message, meta, trace) => nest.error(meta ? { message, ...meta } : message, trace), // eslint-disable-line @typescript-eslint/no-explicit-any
    };
}
