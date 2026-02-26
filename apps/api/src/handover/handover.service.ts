import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { prisma, AssignmentStatus, Prisma, runTransaction } from "@pathway/db";
import type {
  HandoverCreateDto,
  HandoverUpdateDto,
  HandoverApproveDto,
  HandoverAdminListQueryDto,
  HandoverRejectDto,
} from "./dto";

type MyNextHandoverUnavailable = { available: false };

type MyNextHandoverAvailable = {
  available: true;
  sessionId: string;
  startsAt: Date;
  handoverDate: Date;
  logs: Array<{
    id: string;
    groupId: string;
    handoverDate: Date;
    content: unknown;
  }>;
};

export type MyNextHandoverResult =
  | MyNextHandoverUnavailable
  | MyNextHandoverAvailable;

@Injectable()
export class HandoverService {
  async createOrUpdateDraft(
    tenantId: string,
    userId: string,
    dto: HandoverCreateDto,
  ) {
    const group = await prisma.group.findFirst({
      where: { id: dto.groupId, tenantId },
      select: { id: true },
    });
    if (!group) {
      throw new NotFoundException("Group not found for this tenant");
    }

    return runTransaction(async (tx) => {
      const existing = await tx.handoverLog.findFirst({
        where: {
          tenantId,
          groupId: dto.groupId,
          handoverDate: dto.handoverDate,
        },
        select: { id: true, status: true },
      });

      if (existing && existing.status === "APPROVED") {
        throw new BadRequestException("Cannot modify an approved handover log");
      }

      let logId: string;
      if (!existing) {
        const created = await tx.handoverLog.create({
          data: {
            tenantId,
            groupId: dto.groupId,
            handoverDate: dto.handoverDate,
            status: "DRAFT",
            currentContentJson:
              (dto.contentJson as Prisma.InputJsonValue) ??
              Prisma.JsonNullValueInput.JsonNull,
            createdByUserId: userId,
          },
          select: { id: true },
        });
        logId = created.id;
      } else {
        const updated = await tx.handoverLog.update({
          where: { id: existing.id },
          data: {
            currentContentJson:
              (dto.contentJson as Prisma.InputJsonValue) ??
              Prisma.JsonNullValueInput.JsonNull,
            // Preserve existing status unless it was something else; for drafts we keep as-is.
          },
          select: { id: true },
        });
        logId = updated.id;
      }

      const agg = await tx.handoverLogVersion.aggregate({
        where: { handoverLogId: logId },
        _max: { versionNumber: true },
      });
      const nextVersion = (agg._max.versionNumber ?? 0) + 1;

      await tx.handoverLogVersion.create({
        data: {
          handoverLogId: logId,
          versionNumber: nextVersion,
          contentSnapshotJson:
            (dto.contentJson as Prisma.InputJsonValue) ??
            Prisma.JsonNullValueInput.JsonNull,
          editedByUserId: userId,
          changeSummary: dto.changeSummary ?? undefined,
          diffJson: Prisma.NullableJsonNullValueInput.JsonNull,
        },
      });

      return tx.handoverLog.findUniqueOrThrow({
        where: { id: logId },
      });
    });
  }

  async updateLog(
    id: string,
    tenantId: string,
    userId: string,
    dto: HandoverUpdateDto,
  ) {
    const existing = await prisma.handoverLog.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException("Handover log not found");
    }
    if (existing.status === "APPROVED") {
      throw new BadRequestException("Cannot edit an approved handover log");
    }

    const newStatus =
      dto.status && dto.status !== existing.status
        ? dto.status
        : existing.status;
    const newContent =
      dto.contentJson !== undefined
        ? ((dto.contentJson as Prisma.InputJsonValue) ??
          Prisma.JsonNullValueInput.JsonNull)
        : existing.currentContentJson;

    return runTransaction(async (tx) => {
      const updated = await tx.handoverLog.update({
        where: { id: existing.id },
        data: {
          currentContentJson:
            (newContent as Prisma.InputJsonValue) ??
            Prisma.JsonNullValueInput.JsonNull,
          status: newStatus,
        },
      });

      const agg = await tx.handoverLogVersion.aggregate({
        where: { handoverLogId: updated.id },
        _max: { versionNumber: true },
      });
      const nextVersion = (agg._max.versionNumber ?? 0) + 1;

      await tx.handoverLogVersion.create({
        data: {
          handoverLogId: updated.id,
          versionNumber: nextVersion,
          contentSnapshotJson: newContent as Prisma.InputJsonValue,
          editedByUserId: userId,
          changeSummary: dto.changeSummary ?? undefined,
          diffJson: Prisma.JsonNull,
        },
      });

      return updated;
    });
  }

  async approveLog(
    id: string,
    tenantId: string,
    adminUserId: string,
    dto: HandoverApproveDto,
  ) {
    const existing = await prisma.handoverLog.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException("Handover log not found");
    }
    if (existing.status === "APPROVED") {
      // Idempotent approve: nothing to do.
      return existing;
    }

    const content =
      (existing.currentContentJson as Prisma.InputJsonValue) ??
      Prisma.JsonNullValueInput.JsonNull;

    return runTransaction(async (tx) => {
      const updated = await tx.handoverLog.update({
        where: { id: existing.id },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedByUserId: adminUserId,
        },
      });

      const agg = await tx.handoverLogVersion.aggregate({
        where: { handoverLogId: updated.id },
        _max: { versionNumber: true },
      });
      const nextVersion = (agg._max.versionNumber ?? 0) + 1;

      await tx.handoverLogVersion.create({
        data: {
          handoverLogId: updated.id,
          versionNumber: nextVersion,
          contentSnapshotJson: content,
          editedByUserId: adminUserId,
          changeSummary: dto.changeSummary ?? "Approved",
          diffJson: Prisma.NullableJsonNullValueInput.JsonNull,
        },
      });

      return updated;
    });
  }

  async listAdmin(
    tenantId: string,
    filters: HandoverAdminListQueryDto,
  ) {
    const where: Prisma.HandoverLogWhereInput = {
      tenantId,
    };

    if (filters.groupId) {
      where.groupId = filters.groupId;
    }
    if (filters.status) {
      where.status = filters.status as Prisma.HandoverLogWhereInput["status"];
    }

    if (filters.date) {
      // Match a single calendar date
      where.handoverDate = filters.date;
    } else if (filters.fromDate || filters.toDate) {
      where.handoverDate = {};
      if (filters.fromDate) {
        (where.handoverDate as Prisma.DateTimeFilter).gte = filters.fromDate;
      }
      if (filters.toDate) {
        (where.handoverDate as Prisma.DateTimeFilter).lte = filters.toDate;
      }
    }

    return prisma.handoverLog.findMany({
      where,
      orderBy: [
        { handoverDate: "desc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        tenantId: true,
        groupId: true,
        handoverDate: true,
        status: true,
        approvedAt: true,
        approvedByUserId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getAdminById(id: string, tenantId: string) {
    const log = await prisma.handoverLog.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        tenantId: true,
        groupId: true,
        handoverDate: true,
        status: true,
        currentContentJson: true,
        createdByUserId: true,
        approvedByUserId: true,
        approvedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!log) {
      throw new NotFoundException("Handover log not found");
    }
    return log;
  }

  async listVersionsAdmin(id: string, tenantId: string) {
    const log = await prisma.handoverLog.findFirst({
      where: { id, tenantId },
      select: { id: true },
    });
    if (!log) {
      throw new NotFoundException("Handover log not found");
    }

    return prisma.handoverLogVersion.findMany({
      where: { handoverLogId: id },
      orderBy: { versionNumber: "desc" },
      select: {
        id: true,
        versionNumber: true,
        contentSnapshotJson: true,
        editedByUserId: true,
        editedAt: true,
        changeSummary: true,
        diffJson: true,
      },
    });
  }

  async rejectLog(
    id: string,
    tenantId: string,
    adminUserId: string,
    dto: HandoverRejectDto,
  ) {
    const existing = await prisma.handoverLog.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException("Handover log not found");
    }
    if (existing.status !== "PENDING_APPROVAL") {
      throw new BadRequestException(
        "Only logs in PENDING_APPROVAL can be rejected",
      );
    }

    const targetStatus = dto.status ?? "DRAFT";
    const content =
      (existing.currentContentJson as Prisma.InputJsonValue) ??
      Prisma.JsonNullValueInput.JsonNull;

    return runTransaction(async (tx) => {
      const updated = await tx.handoverLog.update({
        where: { id: existing.id },
        data: {
          status: targetStatus,
          approvedAt: null,
          approvedByUserId: null,
        },
      });

      const agg = await tx.handoverLogVersion.aggregate({
        where: { handoverLogId: updated.id },
        _max: { versionNumber: true },
      });
      const nextVersion = (agg._max.versionNumber ?? 0) + 1;

      const summaryBase = dto.reason
        ? `Rejected: ${dto.reason}`
        : "Rejected";

      await tx.handoverLogVersion.create({
        data: {
          handoverLogId: updated.id,
          versionNumber: nextVersion,
          contentSnapshotJson: content,
          editedByUserId: adminUserId,
          changeSummary: summaryBase,
          diffJson: Prisma.NullableJsonNullValueInput.JsonNull,
        },
      });

      return updated;
    });
  }

  async getMyNextHandoverLog(options: {
    tenantId: string;
    userId: string;
  }): Promise<MyNextHandoverResult> {
    const { tenantId, userId } = options;

    const session = await this.getNextSessionForUser(userId, tenantId);
    if (!session) {
      return { available: false };
    }

    const handoverDate = this.computeHandoverDate(session.startsAt);
    const groupIds = session.groups.map((g) => g.id);

    if (groupIds.length === 0) {
      return { available: false };
    }

    const logs = await this.getApprovedLogsForSessionGroups(
      tenantId,
      groupIds,
      handoverDate,
    );

    if (logs.length === 0) {
      return { available: false };
    }

    return {
      available: true,
      sessionId: session.id,
      startsAt: session.startsAt,
      handoverDate,
      logs: logs.map((log) => ({
        id: log.id,
        groupId: log.groupId,
        handoverDate: log.handoverDate,
        content: log.currentContentJson,
      })),
    };
  }

  private async getNextSessionForUser(
    userId: string,
    tenantId: string,
  ): Promise<
    | (Prisma.SessionGetPayload<{
        include: { groups: true };
      }>)
    | null
  > {
    const now = new Date();
    return prisma.session.findFirst({
      where: {
        tenantId,
        startsAt: { gt: now },
        assignments: {
          some: {
            userId,
            status: {
              in: [AssignmentStatus.PENDING, AssignmentStatus.CONFIRMED],
            },
          },
        },
      },
      orderBy: { startsAt: "asc" },
      include: {
        groups: true,
      },
    });
  }

  private computeHandoverDate(startsAt: Date): Date {
    const d = new Date(startsAt);
    // Use UTC date arithmetic for consistency across the platform:
    // handoverDate = UTC calendar day of session.startsAt.
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  private async getApprovedLogsForSessionGroups(
    tenantId: string,
    groupIds: string[],
    handoverDate: Date,
  ) {
    if (groupIds.length === 0) return [];

    const dayStart = new Date(handoverDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    return prisma.handoverLog.findMany({
      where: {
        tenantId,
        groupId: { in: groupIds },
        handoverDate: { gte: dayStart, lt: dayEnd },
        status: "APPROVED",
      },
      select: {
        id: true,
        groupId: true,
        handoverDate: true,
        currentContentJson: true,
      },
      orderBy: [{ groupId: "asc" }, { createdAt: "asc" }],
    });
  }

  async getHandoverForSession(
    sessionId: string,
    tenantId: string,
  ): Promise<{ id: string; status: string } | null> {
    const session = await prisma.session.findFirst({
      where: { id: sessionId, tenantId },
      select: { id: true, startsAt: true, groups: { select: { id: true } } },
    });
    if (!session || session.groups.length === 0) return null;
    const handoverDate = this.computeHandoverDate(session.startsAt);
    const primaryGroupId = session.groups[0].id;
    const dayStart = new Date(handoverDate);
    dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
    const log = await prisma.handoverLog.findFirst({
      where: {
        tenantId,
        groupId: primaryGroupId,
        handoverDate: { gte: dayStart, lt: dayEnd },
      },
      select: { id: true, status: true },
    });
    return log ? { id: log.id, status: log.status } : null;
  }

  async getByIdForStaff(id: string, tenantId: string) {
    const log = await prisma.handoverLog.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        groupId: true,
        handoverDate: true,
        status: true,
        currentContentJson: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!log) throw new NotFoundException("Handover log not found");
    return log;
  }
}

