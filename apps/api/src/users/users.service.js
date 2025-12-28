var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, BadRequestException, NotFoundException, } from "@nestjs/common";
import { prisma } from "@pathway/db";
import { createUserDto } from "./dto/create-user.dto";
import { updateUserDto } from "./dto/update-user.dto";
import { ZodError } from "zod";
function isPrismaError(err) {
    return (typeof err === "object" &&
        err !== null &&
        "code" in err &&
        typeof err.code === "string");
}
let UsersService = class UsersService {
    async list(tenantId) {
        return prisma.user.findMany({
            where: { tenantId },
            select: {
                id: true,
                email: true,
                name: true,
                tenantId: true,
                hasServeAccess: true,
                hasFamilyAccess: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async getById(id, tenantId) {
        const user = await prisma.user.findFirst({
            where: { id, tenantId },
            select: {
                id: true,
                email: true,
                name: true,
                tenantId: true,
                hasServeAccess: true,
                hasFamilyAccess: true,
                createdAt: true,
            },
        });
        if (!user)
            throw new NotFoundException("User not found");
        return user;
    }
    async create(input) {
        // Normalize then validate
        const normalized = {
            ...input,
            email: String(input.email).toLowerCase().trim(),
        };
        try {
            // validate inside try so ZodError maps to 400
            const parsed = createUserDto.parse(normalized);
            // Optional pre-check for friendlier error message on duplicate email
            const existing = await prisma.user.findUnique({
                where: { email: parsed.email },
            });
            if (existing)
                throw new BadRequestException("email already in use");
            // Validate children existence and tenant consistency (if provided)
            if (parsed.children && parsed.children.length) {
                const children = await prisma.child.findMany({
                    where: { id: { in: parsed.children } },
                    select: { id: true, tenantId: true },
                });
                const foundIds = new Set(children.map((c) => c.id));
                const missing = parsed.children.filter((id) => !foundIds.has(id));
                if (missing.length) {
                    throw new BadRequestException({
                        message: "some children not found",
                        missing,
                    });
                }
                const badTenant = children
                    .filter((c) => c.tenantId !== parsed.tenantId)
                    .map((c) => c.id);
                if (badTenant.length) {
                    throw new BadRequestException({
                        message: "children must belong to the same tenant as the user",
                        expectedTenantId: parsed.tenantId,
                        invalidChildIds: badTenant,
                    });
                }
            }
            const data = {
                email: parsed.email,
                name: parsed.name,
                tenant: { connect: { id: parsed.tenantId } },
                hasServeAccess: parsed.hasServeAccess ?? false,
                hasFamilyAccess: parsed.hasFamilyAccess ?? false,
                ...(parsed.children && parsed.children.length
                    ? { children: { connect: parsed.children.map((id) => ({ id })) } }
                    : {}),
            };
            return await prisma.user.create({
                data,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    tenantId: true,
                    hasServeAccess: true,
                    hasFamilyAccess: true,
                    createdAt: true,
                },
            });
        }
        catch (e) {
            if (e instanceof ZodError) {
                throw new BadRequestException(e.errors);
            }
            if (isPrismaError(e) && e.code === "P2002") {
                throw new BadRequestException("email already in use");
            }
            throw e;
        }
    }
    async update(id, input) {
        const normalized = {
            ...input,
            email: input.email ? String(input.email).toLowerCase().trim() : undefined,
        };
        try {
            const parsed = updateUserDto.parse(normalized);
            const current = await prisma.user.findUnique({
                where: { id },
                select: { tenantId: true },
            });
            if (!current)
                throw new NotFoundException("User not found");
            // Prevent cross-tenant updates
            if (parsed.tenantId && parsed.tenantId !== current.tenantId) {
                throw new NotFoundException("User not found");
            }
            // Determine the target tenant for validation
            let targetTenantId = null;
            targetTenantId = parsed.tenantId ?? current.tenantId;
            // Validate children existence and tenant consistency (if provided)
            if (parsed.children && parsed.children.length) {
                const children = await prisma.child.findMany({
                    where: { id: { in: parsed.children } },
                    select: { id: true, tenantId: true },
                });
                const foundIds = new Set(children.map((c) => c.id));
                const missing = parsed.children.filter((cid) => !foundIds.has(cid));
                if (missing.length) {
                    throw new BadRequestException({
                        message: "some children not found",
                        missing,
                    });
                }
                const badTenant = children
                    .filter((c) => c.tenantId !== targetTenantId)
                    .map((c) => c.id);
                if (badTenant.length) {
                    throw new BadRequestException({
                        message: "children must belong to the same tenant as the user",
                        expectedTenantId: targetTenantId,
                        invalidChildIds: badTenant,
                    });
                }
            }
            const data = {
                ...(parsed.email ? { email: parsed.email } : {}),
                ...(parsed.name ? { name: parsed.name } : {}),
                ...(parsed.displayName !== undefined ? { displayName: parsed.displayName } : {}),
                ...(parsed.hasServeAccess !== undefined
                    ? { hasServeAccess: parsed.hasServeAccess }
                    : {}),
                ...(parsed.hasFamilyAccess !== undefined
                    ? { hasFamilyAccess: parsed.hasFamilyAccess }
                    : {}),
                ...(parsed.tenantId
                    ? { tenant: { connect: { id: parsed.tenantId } } }
                    : {}),
                ...(parsed.children
                    ? { children: { set: parsed.children.map((id) => ({ id })) } }
                    : {}),
            };
            return await prisma.user.update({
                where: { id },
                data,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    displayName: true,
                    tenantId: true,
                    hasServeAccess: true,
                    hasFamilyAccess: true,
                    createdAt: true,
                },
            });
        }
        catch (e) {
            if (e instanceof ZodError) {
                throw new BadRequestException(e.errors);
            }
            if (isPrismaError(e) && e.code === "P2002") {
                throw new BadRequestException("email already in use");
            }
            // Prisma throws P2025 on update of missing record; map to 404
            if (isPrismaError(e) && e.code === "P2025") {
                throw new NotFoundException("User not found");
            }
            throw e;
        }
    }
};
UsersService = __decorate([
    Injectable()
], UsersService);
export { UsersService };
