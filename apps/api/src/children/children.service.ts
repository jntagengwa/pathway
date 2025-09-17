import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@pathway/db";
import { CreateChildDto } from "./dto/create-child.dto";
import { UpdateChildDto } from "./dto/update-child.dto";

// Common selection used by handlers
const childSelect = {
  id: true,
  firstName: true,
  lastName: true,
  photoKey: true,
  allergies: true,
  disabilities: true,
  tenantId: true,
  groupId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class ChildrenService {
  async list(tenantId?: string) {
    return prisma.child.findMany({
      where: tenantId ? { tenantId } : undefined,
      select: childSelect,
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });
  }

  async getById(id: string) {
    const child = await prisma.child.findUnique({
      where: { id },
      select: childSelect,
    });
    if (!child) throw new NotFoundException("Child not found");
    return child;
  }

  /**
   * Create a child within a tenant and optionally link to a group and guardians (parents).
   * Guardrails:
   *  - tenantId must exist
   *  - if groupId provided, it must belong to the same tenant
   *  - all guardianIds must belong to the same tenant
   */
  async create(input: CreateChildDto) {
    // Basic normalization (trim names)
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();

    // 1) Ensure tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: input.tenantId },
      select: { id: true },
    });
    if (!tenant) throw new BadRequestException("tenant not found");

    // 2) If group provided, ensure it belongs to the same tenant
    if (input.groupId) {
      const group = await prisma.group.findUnique({
        where: { id: input.groupId },
        select: { id: true, tenantId: true },
      });
      if (!group) throw new BadRequestException("group not found");
      if (group.tenantId !== input.tenantId)
        throw new BadRequestException("group does not belong to tenant");
    }

    // 3) If guardians provided, ensure all belong to same tenant
    let guardiansConnect: { id: string }[] | undefined;
    if (input.guardianIds && input.guardianIds.length > 0) {
      const guardians = await prisma.user.findMany({
        where: { id: { in: input.guardianIds } },
        select: { id: true, tenantId: true },
      });
      if (guardians.length !== input.guardianIds.length) {
        throw new BadRequestException("one or more guardians not found");
      }
      const invalid = guardians.find((g) => g.tenantId !== input.tenantId);
      if (invalid)
        throw new BadRequestException("guardian does not belong to tenant");
      guardiansConnect = guardians.map((g) => ({ id: g.id }));
    }

    // 4) Create
    return prisma.child.create({
      data: {
        firstName,
        lastName,
        photoKey: input.photoKey ?? null,
        allergies: input.allergies,
        disabilities: input.disabilities ?? [],
        tenant: { connect: { id: input.tenantId } },
        ...(input.groupId ? { group: { connect: { id: input.groupId } } } : {}),
        ...(guardiansConnect
          ? { guardians: { connect: guardiansConnect } }
          : {}),
      },
      select: childSelect,
    });
  }

  /**
   * Update fields; if guardianIds provided, replace the set (idempotent) after validations.
   */
  async update(id: string, input: UpdateChildDto) {
    // Ensure child exists and capture its tenant for checks
    const current = await prisma.child.findUnique({
      where: { id },
      select: { id: true, tenantId: true },
    });
    if (!current) throw new NotFoundException("Child not found");

    // If group provided, ensure it belongs to the same tenant
    if (input.groupId) {
      const group = await prisma.group.findUnique({
        where: { id: input.groupId },
        select: { id: true, tenantId: true },
      });
      if (!group) throw new BadRequestException("group not found");
      if (group.tenantId !== current.tenantId)
        throw new BadRequestException("group does not belong to tenant");
    }

    // If guardianIds provided, ensure all belong to same tenant and build `set`
    let guardiansSet: { id: string }[] | undefined;
    if (input.guardianIds) {
      if (input.guardianIds.length > 0) {
        const guardians = await prisma.user.findMany({
          where: { id: { in: input.guardianIds } },
          select: { id: true, tenantId: true },
        });
        if (guardians.length !== input.guardianIds.length) {
          throw new BadRequestException("one or more guardians not found");
        }
        const invalid = guardians.find((g) => g.tenantId !== current.tenantId);
        if (invalid)
          throw new BadRequestException("guardian does not belong to tenant");
        guardiansSet = guardians.map((g) => ({ id: g.id }));
      } else {
        guardiansSet = []; // explicit clear
      }
    }

    return prisma.child.update({
      where: { id },
      data: {
        ...(input.firstName ? { firstName: input.firstName.trim() } : {}),
        ...(input.lastName ? { lastName: input.lastName.trim() } : {}),
        ...(input.photoKey !== undefined ? { photoKey: input.photoKey } : {}),
        ...(input.allergies !== undefined
          ? { allergies: input.allergies }
          : {}),
        ...(input.disabilities !== undefined
          ? { disabilities: input.disabilities }
          : {}),
        ...(input.groupId !== undefined
          ? input.groupId
            ? { group: { connect: { id: input.groupId } } }
            : { group: { disconnect: true } }
          : {}),
        ...(guardiansSet !== undefined
          ? { guardians: { set: guardiansSet } }
          : {}),
      },
      select: childSelect,
    });
  }
}
