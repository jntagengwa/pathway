import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@pathway/db";
import { createGroupDto, type CreateGroupDto } from "./dto/create-group.dto";
import { updateGroupDto, type UpdateGroupDto } from "./dto/update-group.dto";
import { ZodError } from "zod";

function isPrismaError(err: unknown): err is { code: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code?: unknown }).code === "string"
  );
}

@Injectable()
export class GroupsService {
  async list(tenantId: string) {
    return prisma.group.findMany({
      where: { tenantId },
      select: { id: true, name: true, tenantId: true },
      orderBy: { name: "asc" },
    });
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
      },
    });
    if (!group) throw new NotFoundException("Group not found");
    return group;
  }

  async create(input: CreateGroupDto, tenantId: string) {
    // Normalize then validate
    const normalized: CreateGroupDto = {
      ...input,
      tenantId,
      name: String(input.name).trim(),
      minAge: input.minAge,
      maxAge: input.maxAge,
    };

    try {
      const parsed = createGroupDto.parse(normalized);

      // additional validation: minAge must be <= maxAge
      if (parsed.minAge > parsed.maxAge) {
        throw new BadRequestException("minAge cannot exceed maxAge");
      }

      // ensure tenant exists to return clean 400 instead of FK error
      const tenantExists = await prisma.tenant.findUnique({
        where: { id: parsed.tenantId },
        select: { id: true },
      });
      if (!tenantExists) {
        throw new BadRequestException("tenant not found");
      }

      // optional: prevent duplicate group names per tenant (if you have a unique index)
      // adjust if schema enforces uniqueness differently
      const existing = await prisma.group.findFirst({
        where: { tenantId: parsed.tenantId, name: parsed.name },
      });
      if (existing)
        throw new BadRequestException("group name already exists for tenant");

      return await prisma.group.create({
        data: {
          name: parsed.name,
          minAge: parsed.minAge,
          maxAge: parsed.maxAge,
          tenant: { connect: { id: parsed.tenantId } },
        },
        select: {
          id: true,
          name: true,
          tenantId: true,
          minAge: true,
          maxAge: true,
        },
      });
    } catch (e: unknown) {
      if (e instanceof ZodError) {
        throw new BadRequestException(e.errors);
      }
      if (isPrismaError(e) && e.code === "P2002") {
        // unique constraint violation
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
        select: { id: true, tenantId: true },
      });
      if (!existing) throw new NotFoundException("Group not found");

      // if both ages provided, ensure logical order
      if (
        typeof parsed.minAge === "number" &&
        typeof parsed.maxAge === "number" &&
        parsed.minAge > parsed.maxAge
      ) {
        throw new BadRequestException("minAge cannot exceed maxAge");
      }

      return await prisma.group.update({
        where: { id },
        data: parsed,
        select: {
          id: true,
          name: true,
          tenantId: true,
          minAge: true,
          maxAge: true,
        },
      });
    } catch (e: unknown) {
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
