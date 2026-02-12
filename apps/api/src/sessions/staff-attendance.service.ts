import {
  Injectable,
  Scope,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { prisma, StaffAttendanceStatus } from "@pathway/db";
import type { UpsertStaffAttendanceDto } from "./dto/upsert-staff-attendance.dto";

export type StaffAttendanceRosterItem = {
  staffUserId: string;
  displayName: string;
  roleLabel: string;
  assigned: boolean;
  attendanceStatus: "PRESENT" | "ABSENT" | "UNKNOWN";
};

/** SiteRole from schema: SITE_ADMIN and STAFF can mark. VIEWER cannot. OrgRole ORG_ADMIN can. */
const ATTENDANCE_WRITE_SITE_ROLES = ["SITE_ADMIN", "STAFF"] as const;

@Injectable({ scope: Scope.REQUEST })
export class StaffAttendanceService {
  /**
   * Check if user can mark staff attendance by querying DB directly.
   * Bypasses PathwayRequestContext to avoid scope/context issues.
   */
  private async canMarkStaffAttendance(userId: string, tenantId: string): Promise<boolean> {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { orgId: true },
    });
    if (!tenant) return false;

    const [siteMembership, orgMembership] = await Promise.all([
      prisma.siteMembership.findFirst({
        where: { userId, tenantId },
        select: { role: true },
      }),
      prisma.orgMembership.findFirst({
        where: { userId, orgId: tenant.orgId },
        select: { role: true },
      }),
    ]);

    if (siteMembership && ATTENDANCE_WRITE_SITE_ROLES.includes(siteMembership.role as (typeof ATTENDANCE_WRITE_SITE_ROLES)[number]))
      return true;
    if (orgMembership?.role === "ORG_ADMIN") return true;

    // Legacy UserTenantRole (ADMIN, TEACHER, COORDINATOR)
    const legacyRole = await prisma.userTenantRole.findFirst({
      where: { userId, tenantId },
      select: { role: true },
    });
    if (legacyRole && ["ADMIN", "TEACHER", "COORDINATOR"].includes(legacyRole.role))
      return true;

    return false;
  }

  async getRoster(sessionId: string, tenantId: string): Promise<StaffAttendanceRosterItem[]> {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, tenantId },
      select: {
        id: true,
        assignments: {
          select: {
            userId: true,
            role: true,
            user: {
              select: {
                id: true,
                displayName: true,
                name: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        sessionStaffAttendance: {
          select: {
            staffUserId: true,
            status: true,
          },
        },
      },
    });
    if (!session) throw new NotFoundException("Session not found");

    const statusByStaff = new Map(
      session.sessionStaffAttendance.map((s) => [s.staffUserId, s.status]),
    );
    const roleLabel = (role: string) => {
      const u = (role ?? "").toUpperCase();
      if (u === "LEAD") return "Lead";
      if (u === "SUPPORT") return "Support";
      if (u === "TEACHER" || u === "ADMIN") return "Lead";
      if (u === "COORDINATOR") return "Coordinator";
      return "Support";
    };

    return session.assignments.map((a) => {
      const u = a.user;
      const parts = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
      const displayName =
        (u.displayName && !/^[^@]+@[^@]+\.[^@]+$/.test(u.displayName))
          ? u.displayName
          : ((u.name ?? (parts || `Staff ${u.id.slice(0, 8)}`)) ?? "Staff");
      return {
        staffUserId: u.id,
        displayName,
        roleLabel: roleLabel(a.role),
        assigned: true,
        attendanceStatus: (statusByStaff.get(u.id) ?? StaffAttendanceStatus.UNKNOWN) as "PRESENT" | "ABSENT" | "UNKNOWN",
      };
    });
  }

  async upsert(
    sessionId: string,
    tenantId: string,
    userId: string,
    dto: UpsertStaffAttendanceDto,
  ): Promise<StaffAttendanceRosterItem[]> {
    const canMark = await this.canMarkStaffAttendance(userId, tenantId);
    if (!canMark) {
      throw new ForbiddenException(
        "SITE_ADMIN, STAFF, or ORG_ADMIN role required to mark staff attendance. VIEWER cannot affect attendance.",
      );
    }

    const session = await prisma.session.findFirst({
      where: { id: sessionId, tenantId },
      select: { id: true, assignments: { select: { userId: true } } },
    });
    if (!session) throw new NotFoundException("Session not found");

    const assignedUserIds = new Set(session.assignments.map((a) => a.userId));
    if (!assignedUserIds.has(dto.staffUserId)) {
      throw new BadRequestException("Staff member is not assigned to this session");
    }

    const status = dto.status as StaffAttendanceStatus;
    const now = new Date();

    await prisma.sessionStaffAttendance.upsert({
      where: {
        tenantId_sessionId_staffUserId: {
          tenantId,
          sessionId,
          staffUserId: dto.staffUserId,
        },
      },
      create: {
        tenantId,
        sessionId,
        staffUserId: dto.staffUserId,
        status,
        markedByUserId: userId,
        markedAt: now,
      },
      update: {
        status,
        markedByUserId: userId,
        markedAt: now,
      },
    });

    return this.getRoster(sessionId, tenantId);
  }
}
