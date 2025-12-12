import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma, Weekday } from "@pathway/db";
import type {
  CreateVolunteerPreferenceDto,
  UpdateVolunteerPreferenceDto,
} from "./dto";

export interface PreferenceListQuery {
  userId?: string;
  tenantId: string;
  weekday?: Weekday;
  /** Return preferences that start at or after this minute (0-1439) */
  startMinuteGte?: number;
  /** Return preferences that end at or before this minute (1-1440) */
  endMinuteLte?: number;
}

@Injectable()
export class PreferencesService {
  /** Create a volunteer preference window */
  async create(dto: CreateVolunteerPreferenceDto, tenantId: string) {
    const resolvedTenantId = tenantId ?? dto.tenantId;
    if (!resolvedTenantId) throw new NotFoundException("tenant not found");
    return prisma.volunteerPreference.create({
      data: {
        userId: dto.userId,
        tenantId: resolvedTenantId,
        weekday: dto.weekday as Weekday,
        startMinute: dto.startMinute,
        endMinute: dto.endMinute,
      },
    });
  }

  /**
   * List preferences with optional filters. Results are newest-first for test stability
   * and predictable pagination.
   */
  async findAll(filters: PreferenceListQuery) {
    return prisma.volunteerPreference.findMany({
      where: {
        userId: filters.userId,
        tenantId: filters.tenantId,
        weekday: filters.weekday,
        startMinute:
          typeof filters.startMinuteGte === "number"
            ? { gte: filters.startMinuteGte }
            : undefined,
        endMinute:
          typeof filters.endMinuteLte === "number"
            ? { lte: filters.endMinuteLte }
            : undefined,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /** Get a single preference by id */
  async findOne(id: string, tenantId: string) {
    const pref = await prisma.volunteerPreference.findFirst({
      where: { id, tenantId },
    });
    if (!pref) throw new NotFoundException(`Preference ${id} not found`);
    return pref;
  }

  /** Update an existing preference */
  async update(
    id: string,
    dto: UpdateVolunteerPreferenceDto,
    tenantId: string,
  ) {
    const resolvedTenantId = tenantId ?? dto.tenantId;
    try {
      return await prisma.volunteerPreference.update({
        where: { id },
        data: {
          // Only pass fields that may be present on the partial DTO
          userId: dto.userId,
          tenantId: resolvedTenantId,
          weekday: dto.weekday as Weekday | undefined,
          startMinute: dto.startMinute,
          endMinute: dto.endMinute,
        },
      });
    } catch (e) {
      // If Prisma throws because the record does not exist, surface a 404
      const existing = await prisma.volunteerPreference.findUnique({
        where: { id },
      });
      if (!existing) throw new NotFoundException(`Preference ${id} not found`);
      throw e;
    }
  }

  /** Delete and return the deleted preference */
  async remove(id: string, tenantId: string) {
    try {
      return await prisma.volunteerPreference.deleteMany({
        where: { id, tenantId },
      });
    } catch (e) {
      // Align error semantics with other modules
      const existing = await prisma.volunteerPreference.findFirst({
        where: { id, tenantId },
      });
      if (!existing) throw new NotFoundException(`Preference ${id} not found`);
      throw e;
    }
  }
}
