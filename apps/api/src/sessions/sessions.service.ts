import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@pathway/db";
import {
  createSessionSchema,
  type CreateSessionDto,
} from "./dto/create-session.dto";
import {
  updateSessionSchema,
  type UpdateSessionDto,
} from "./dto/update-session.dto";

export interface SessionListFilters {
  tenantId?: string;
  groupId?: string;
  /** overlap window start */
  from?: Date;
  /** overlap window end */
  to?: Date;
}

@Injectable()
export class SessionsService {
  async list(filters: SessionListFilters = {}) {
    const where: {
      tenantId?: string;
      groupId?: string | null;
      AND?: Array<Record<string, unknown>>;
    } = {};

    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.groupId) where.groupId = filters.groupId;

    const andClauses: Array<Record<string, unknown>> = [];
    const { from, to } = filters;
    if (from && to) {
      // overlapping window: startsAt <= to AND endsAt >= from
      andClauses.push({ startsAt: { lte: to } });
      andClauses.push({ endsAt: { gte: from } });
    } else if (from) {
      andClauses.push({ endsAt: { gte: from } });
    } else if (to) {
      andClauses.push({ startsAt: { lte: to } });
    }
    if (andClauses.length) where.AND = andClauses;

    return prisma.session.findMany({
      where,
      orderBy: { startsAt: "asc" },
    });
  }

  async getById(id: string) {
    const s = await prisma.session.findUnique({ where: { id } });
    if (!s) throw new NotFoundException("Session not found");
    return s;
  }

  async create(input: CreateSessionDto) {
    // Normalize & validate (map Zod errors to HTTP 400)
    let parsed: CreateSessionDto;
    try {
      parsed = createSessionSchema.parse(input);
    } catch {
      throw new BadRequestException("invalid body");
    }
    if (parsed.endsAt.getTime() <= parsed.startsAt.getTime()) {
      throw new BadRequestException("endsAt must be after startsAt");
    }

    // ensure tenant exists for clearer error than FK violation
    const tenant = await prisma.tenant.findUnique({
      where: { id: parsed.tenantId },
      select: { id: true },
    });
    if (!tenant) throw new BadRequestException("tenant not found");

    // optional group tenant check
    if (parsed.groupId) {
      const grp = await prisma.group.findUnique({
        where: { id: parsed.groupId },
        select: { tenantId: true },
      });
      if (!grp) throw new BadRequestException("group not found");
      if (grp.tenantId !== parsed.tenantId)
        throw new BadRequestException("group/tenant mismatch");
    }

    // At this point inputs are valid and tenant/group consistency is checked
    try {
      const created = await prisma.session.create({
        data: {
          tenantId: parsed.tenantId,
          groupId: parsed.groupId ?? null,
          startsAt: parsed.startsAt,
          endsAt: parsed.endsAt,
          title: parsed.title?.trim() ?? null,
        },
      });
      return created;
    } catch {
      // surface as 400 for now; can expand specific Prisma error handling later
      throw new BadRequestException("failed to create session");
    }
  }

  async update(id: string, input: UpdateSessionDto) {
    const changes = updateSessionSchema.parse(input);

    // Fetch current for cross-field validation when only one date is provided
    const current = await prisma.session.findUnique({
      where: { id },
      select: { tenantId: true, groupId: true, startsAt: true, endsAt: true },
    });
    if (!current) throw new NotFoundException("Session not found");

    // If groupId provided, validate tenant match
    if (typeof changes.groupId !== "undefined" && changes.groupId !== null) {
      const grp = await prisma.group.findUnique({
        where: { id: changes.groupId },
        select: { tenantId: true },
      });
      if (!grp) throw new BadRequestException("group not found");
      const targetTenantId = changes.tenantId ?? current.tenantId;
      if (grp.tenantId !== targetTenantId)
        throw new BadRequestException("group/tenant mismatch");
    }

    // Validate date ordering if only one boundary provided
    const nextStarts = changes.startsAt ?? current.startsAt;
    const nextEnds = changes.endsAt ?? current.endsAt;
    if (nextEnds <= nextStarts)
      throw new BadRequestException("endsAt must be after startsAt");

    const updated = await prisma.session.update({
      where: { id },
      data: {
        tenantId: changes.tenantId ?? current.tenantId,
        groupId:
          typeof changes.groupId === "undefined"
            ? current.groupId
            : (changes.groupId ?? null),
        startsAt: nextStarts,
        endsAt: nextEnds,
        title:
          typeof changes.title === "undefined"
            ? undefined
            : (changes.title?.trim() ?? null),
      },
    });
    return updated;
  }

  async delete(id: string) {
    try {
      await prisma.session.delete({ where: { id } });
      return { id };
    } catch {
      // Prisma P2025 (record not found) -> 404
      throw new NotFoundException("Session not found");
    }
  }
}
