import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { prisma } from "@pathway/db";
import { createGroupDto, type CreateGroupDto } from "./dto/create-group.dto";
import { updateGroupDto, type UpdateGroupDto } from "./dto/update-group.dto";
import { EntitlementsService } from "../billing/entitlements.service";
import { getPlanDefinition } from "../billing/billing-plans";
import { ZodError } from "zod";

function isPrismaError(err: unknown): err is { code: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code?: unknown }).code === "string"
  );
}

export type ListGroupsOptions = { activeOnly?: boolean };

@Injectable()
export class GroupsService {
  constructor(
    @Inject(forwardRef(() => EntitlementsService))
    private readonly entitlements: EntitlementsService,
  ) {}

  async list(tenantId: string, options: ListGroupsOptions = {}) {
    const where: { tenantId: string; isActive?: boolean } = { tenantId };
    if (options.activeOnly) {
      where.isActive = true;
    }

    const groups = await prisma.group.findMany({
      where,
      select: {
        id: true,
        name: true,
        tenantId: true,
        minAge: true,
        maxAge: true,
        description: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { sessions: true } },
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      tenantId: g.tenantId,
      minAge: g.minAge,
      maxAge: g.maxAge,
      description: g.description,
      isActive: g.isActive,
      sortOrder: g.sortOrder,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      sessionsCount: g._count.sessions,
    }));
  }

  async getById(id: string, tenantId: string) {
    const group = await prisma.group.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        name: true,
        tenantId: true,
        minAge: true,
        maxAge: true,
        description: true,
        isActive: true,
        sortOrder: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { sessions: true } },
      },
    });
    if (!group) throw new NotFoundException("Group not found");
    return {
      ...group,
      sessionsCount: group._count.sessions,
      _count: undefined,
    };
  }

  async create(input: CreateGroupDto, tenantId: string) {
    const normalized: CreateGroupDto = {
      ...input,
      tenantId,
      name: String(input.name).trim(),
      minAge: input.minAge ?? undefined,
      maxAge: input.maxAge ?? undefined,
      description: input.description?.trim() || undefined,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? undefined,
    };

    try {
      const parsed = createGroupDto.parse(normalized);

      const minAge = parsed.minAge ?? null;
      const maxAge = parsed.maxAge ?? null;
      if (
        minAge !== null &&
        maxAge !== null &&
        typeof minAge === "number" &&
        typeof maxAge === "number" &&
        minAge > maxAge
      ) {
        throw new BadRequestException("minAge cannot exceed maxAge");
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: parsed.tenantId },
        select: { id: true, orgId: true },
      });
      if (!tenant) {
        throw new BadRequestException("tenant not found");
      }

      // Plan gating: Core plan max 4 active classes
      if (parsed.isActive !== false) {
        const resolved = await this.entitlements.resolve(tenant.orgId);
        const planCode =
          resolved.subscription?.planCode ?? resolved.flags?.planCode;
        const def = getPlanDefinition(
          typeof planCode === "string" ? planCode : null,
        );
        const maxActive = def?.maxActiveClasses ?? null;
        if (maxActive !== null) {
          const activeCount = await prisma.group.count({
            where: { tenantId: parsed.tenantId, isActive: true },
          });
          if (activeCount >= maxActive) {
            throw new BadRequestException(
              `Your plan allows a maximum of ${maxActive} active classes. Upgrade to add more.`,
            );
          }
        }
      }

      const existing = await prisma.group.findFirst({
        where: { tenantId: parsed.tenantId, name: parsed.name },
      });
      if (existing) {
        throw new BadRequestException("group name already exists for tenant");
      }

      return await prisma.group.create({
        data: {
          name: parsed.name,
          minAge: parsed.minAge ?? undefined,
          maxAge: parsed.maxAge ?? undefined,
          description: parsed.description ?? undefined,
          isActive: parsed.isActive ?? true,
          sortOrder: parsed.sortOrder ?? undefined,
          tenant: { connect: { id: parsed.tenantId } },
        },
        select: {
          id: true,
          name: true,
          tenantId: true,
          minAge: true,
          maxAge: true,
          description: true,
          isActive: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (e: unknown) {
      if (e instanceof BadRequestException) throw e;
      if (e instanceof ZodError) {
        throw new BadRequestException(e.errors);
      }
      if (isPrismaError(e) && e.code === "P2002") {
        throw new BadRequestException("group already exists");
      }
      throw e;
    }
  }

  async update(id: string, input: UpdateGroupDto, tenantId: string) {
    const normalized = {
      ...input,
      name: input.name ? String(input.name).trim() : undefined,
    };

    try {
      const parsed = updateGroupDto.parse(normalized);

      const existing = await prisma.group.findFirst({
        where: { id, tenantId },
        select: { id: true, tenantId: true, isActive: true },
      });
      if (!existing) throw new NotFoundException("Group not found");

      // Plan gating when activating a class
      if (parsed.isActive === true && !existing.isActive) {
        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: { orgId: true },
        });
        if (tenant) {
          const resolved = await this.entitlements.resolve(tenant.orgId);
          const planCode =
            resolved.subscription?.planCode ?? resolved.flags?.planCode;
          const def = getPlanDefinition(
            typeof planCode === "string" ? planCode : null,
          );
          const maxActive = def?.maxActiveClasses ?? null;
          if (maxActive !== null) {
            const activeCount = await prisma.group.count({
              where: { tenantId, isActive: true },
            });
            if (activeCount >= maxActive) {
              throw new BadRequestException(
                `Your plan allows a maximum of ${maxActive} active classes. Upgrade to add more.`,
              );
            }
          }
        }
      }

      const minAge = parsed.minAge ?? null;
      const maxAge = parsed.maxAge ?? null;
      if (
        minAge !== null &&
        maxAge !== null &&
        typeof minAge === "number" &&
        typeof maxAge === "number" &&
        minAge > maxAge
      ) {
        throw new BadRequestException("minAge cannot exceed maxAge");
      }

      const data: Record<string, unknown> = {};
      if (parsed.name !== undefined) data.name = parsed.name;
      if (parsed.minAge !== undefined) data.minAge = parsed.minAge;
      if (parsed.maxAge !== undefined) data.maxAge = parsed.maxAge;
      if (parsed.description !== undefined) data.description = parsed.description;
      if (parsed.isActive !== undefined) data.isActive = parsed.isActive;
      if (parsed.sortOrder !== undefined) data.sortOrder = parsed.sortOrder;

      return await prisma.group.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          tenantId: true,
          minAge: true,
          maxAge: true,
          description: true,
          isActive: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (e: unknown) {
      if (e instanceof BadRequestException) throw e;
      if (e instanceof NotFoundException) throw e;
      if (e instanceof ZodError) {
        throw new BadRequestException(e.errors);
      }
      if (isPrismaError(e) && e.code === "P2002") {
        throw new BadRequestException("group already exists");
      }
      if (isPrismaError(e) && e.code === "P2025") {
        throw new NotFoundException("Group not found");
      }
      throw e;
    }
  }
}
