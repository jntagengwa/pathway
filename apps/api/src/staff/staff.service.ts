import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { prisma, Weekday } from "@pathway/db";
import type { UpdateStaffDto } from "./dto/update-staff.dto";
import { getPlanDefinition } from "../billing/billing-plans";

function minuteFromTime(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function timeFromMinute(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/** Staff has access to tenant if they have SiteMembership or legacy User.tenantId */
async function assertStaffInTenant(
  userId: string,
  tenantId: string,
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      tenantId: true,
      siteMemberships: { where: { tenantId }, select: { id: true } },
    },
  });
  if (!user) throw new NotFoundException("Staff member not found");
  const hasAccess =
    user.tenantId === tenantId || user.siteMemberships.length > 0;
  if (!hasAccess) throw new NotFoundException("Staff member not found");
}

@Injectable()
export class StaffService {
  async getById(
    userId: string,
    tenantId: string,
    orgId: string,
  ): Promise<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    fullName: string;
    email: string | null;
    role: string;
    isActive: boolean;
    weeklyAvailability: { day: Weekday; startTime: string; endTime: string }[];
    unavailableDates: { date: string; reason: string | null }[];
    preferredGroups: { id: string; name: string }[];
    canEditAvailability: boolean;
  }> {
    await assertStaffInTenant(userId, tenantId);

    const [user, preferences, unavailableDates, preferredGroups, entitlements] =
      await Promise.all([
        prisma.user.findUniqueOrThrow({
          where: { id: userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            displayName: true,
            email: true,
            isActive: true,
          },
        }),
        prisma.volunteerPreference.findMany({
          where: { userId, tenantId },
          orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
        }),
        prisma.staffUnavailableDate.findMany({
          where: { userId, tenantId },
          orderBy: { date: "asc" },
        }),
        prisma.staffPreferredGroup.findMany({
          where: { userId, tenantId },
          include: { group: { select: { id: true, name: true } } },
        }),
        this.resolvePlanTier(orgId),
      ]);

    const fullName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.name ||
      user.displayName ||
      "Unknown";

    const siteMembership = await prisma.siteMembership.findUnique({
      where: { tenantId_userId: { tenantId, userId } },
      select: { role: true },
    });
    const role = siteMembership?.role ?? "STAFF";

    const weeklyAvailability = preferences.map((p) => ({
      day: p.weekday,
      startTime: timeFromMinute(p.startMinute),
      endTime: timeFromMinute(p.endMinute),
    }));

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName,
      email: user.email,
      role,
      isActive: user.isActive,
      weeklyAvailability,
      unavailableDates: unavailableDates.map((u) => ({
        date: u.date.toISOString().slice(0, 10),
        reason: u.reason,
      })),
      preferredGroups: preferredGroups.map((pg) => ({
        id: pg.group.id,
        name: pg.group.name,
      })),
      canEditAvailability: entitlements,
    };
  }

  private async resolvePlanTier(orgId: string): Promise<boolean> {
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: { isMasterOrg: true },
    });
    if (org?.isMasterOrg) return true;

    const subscription = await prisma.subscription.findFirst({
      where: { orgId },
      orderBy: { periodEnd: "desc" },
    });
    const planCode = subscription?.planCode ?? null;
    const def = getPlanDefinition(planCode);
    const tier = def?.tier ?? "core";
    return tier !== "core";
  }

  async update(
    userId: string,
    tenantId: string,
    orgId: string,
    dto: UpdateStaffDto,
  ): Promise<ReturnType<StaffService["getById"]>> {
    await assertStaffInTenant(userId, tenantId);

    const canEditAvailability = await this.resolvePlanTier(orgId);
    if (!canEditAvailability) {
      const availabilityFields: (keyof UpdateStaffDto)[] = [
        "weeklyAvailability",
        "unavailableDates",
        "preferredGroupIds",
      ];
      const hasBlockedField = availabilityFields.some(
        (f) => dto[f as keyof UpdateStaffDto] !== undefined,
      );
      if (hasBlockedField) {
        throw new BadRequestException(
          "Availability and preferences require Starter plan or above. Upgrade to edit.",
        );
      }
    }

    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...(dto.firstName !== undefined && { firstName: dto.firstName }),
          ...(dto.lastName !== undefined && { lastName: dto.lastName }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        },
      });
    } else if (dto.isActive !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: dto.isActive },
      });
    }

    if (dto.role !== undefined) {
      await prisma.siteMembership.upsert({
        where: { tenantId_userId: { tenantId, userId } },
        create: { tenantId, userId, role: dto.role },
        update: { role: dto.role },
      });
    }

    if (canEditAvailability && dto.weeklyAvailability !== undefined) {
      const rangesByDay = new Map<Weekday, { start: number; end: number }[]>();
      for (const item of dto.weeklyAvailability) {
        const start = minuteFromTime(item.startTime);
        const end = minuteFromTime(item.endTime);
        if (start >= end) {
          throw new BadRequestException(
            `Invalid range for ${item.day}: start must be before end`,
          );
        }
        const existing = rangesByDay.get(item.day) ?? [];
        const overlaps = existing.some(
          (r) => start < r.end && end > r.start,
        );
        if (overlaps) {
          throw new BadRequestException(
            `Overlapping time ranges for ${item.day}`,
          );
        }
        existing.push({ start, end });
        rangesByDay.set(item.day, existing);
      }

      await prisma.volunteerPreference.deleteMany({
        where: { userId, tenantId },
      });
      for (const [day, ranges] of rangesByDay) {
        for (const { start, end } of ranges) {
          await prisma.volunteerPreference.create({
            data: { userId, tenantId, weekday: day, startMinute: start, endMinute: end },
          });
        }
      }
    }

    if (canEditAvailability && dto.unavailableDates !== undefined) {
      const seen = new Set<string>();
      const toCreate = dto.unavailableDates.filter((u) => {
        if (seen.has(u.date)) return false;
        seen.add(u.date);
        return true;
      });
      await prisma.staffUnavailableDate.deleteMany({
        where: { userId, tenantId },
      });
      for (const u of toCreate) {
        await prisma.staffUnavailableDate.create({
          data: {
            userId,
            tenantId,
            date: new Date(u.date),
            reason: u.reason ?? null,
          },
        });
      }
    }

    if (canEditAvailability && dto.preferredGroupIds !== undefined) {
      const groups = await prisma.group.findMany({
        where: { id: { in: dto.preferredGroupIds }, tenantId },
        select: { id: true },
      });
      const validIds = new Set(groups.map((g) => g.id));
      const invalid = dto.preferredGroupIds.filter((id) => !validIds.has(id));
      if (invalid.length > 0) {
        throw new BadRequestException(
          `Invalid group IDs for this site: ${invalid.join(", ")}`,
        );
      }
      await prisma.staffPreferredGroup.deleteMany({
        where: { userId, tenantId },
      });
      for (const groupId of dto.preferredGroupIds) {
        await prisma.staffPreferredGroup.create({
          data: { userId, tenantId, groupId },
        });
      }
    }

    return this.getById(userId, tenantId, orgId);
  }
}
