import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@pathway/db";
import { CreateAttendanceDto } from "./dto/create-attendance.dto";
import { UpdateAttendanceDto } from "./dto/update-attendance.dto";

const SELECT = {
  id: true,
  childId: true,
  groupId: true,
  present: true,
  timestamp: true,
  sessionId: true,
} as const;

@Injectable()
export class AttendanceService {
  async list() {
    return prisma.attendance.findMany({
      select: SELECT,
      orderBy: [{ timestamp: "desc" }],
    });
  }

  async getById(id: string) {
    const row = await prisma.attendance.findUnique({
      where: { id },
      select: SELECT,
    });
    if (!row) throw new NotFoundException("Attendance not found");
    return row;
  }

  async create(input: CreateAttendanceDto) {
    // Validate child exists
    const child = await prisma.child.findUnique({
      where: { id: input.childId },
      select: { id: true, tenantId: true },
    });
    if (!child) throw new BadRequestException("child not found");

    // Validate group exists
    const group = await prisma.group.findUnique({
      where: { id: input.groupId },
      select: { id: true, tenantId: true },
    });
    if (!group) throw new BadRequestException("group not found");

    // Optional: validate session exists and is consistent
    if (input.sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: input.sessionId },
        select: { id: true, tenantId: true, groupId: true },
      });
      if (!session) throw new BadRequestException("session not found");
      if (session.tenantId !== child.tenantId) {
        throw new BadRequestException(
          "session does not belong to the child's tenant",
        );
      }
      if (session.groupId && session.groupId !== input.groupId) {
        throw new BadRequestException("session is for a different group");
      }
    }

    // Cross-tenant guard
    if (child.tenantId !== group.tenantId) {
      throw new BadRequestException(
        "child and group must belong to same tenant",
      );
    }

    const created = await prisma.attendance.create({
      data: {
        child: { connect: { id: input.childId } },
        group: { connect: { id: input.groupId } },
        present: input.present,
        timestamp: input.timestamp ?? new Date(),
        ...(input.sessionId
          ? { session: { connect: { id: input.sessionId } } }
          : {}),
      },
      select: SELECT,
    });
    return created;
  }

  async update(id: string, input: UpdateAttendanceDto) {
    // Ensure row exists (also used to infer tenant via relations if needed)
    const current = await prisma.attendance.findUnique({
      where: { id },
      select: {
        id: true,
        groupId: true,
        child: { select: { tenantId: true } },
      },
    });
    if (!current) throw new NotFoundException("Attendance not found");

    // If groupId is changing, ensure cross-tenant safety with the child's tenant
    if (input.groupId) {
      const group = await prisma.group.findUnique({
        where: { id: input.groupId },
        select: { id: true, tenantId: true },
      });
      if (!group) throw new BadRequestException("group not found");
      if (group.tenantId !== current.child.tenantId) {
        throw new BadRequestException(
          "group does not belong to the child's tenant",
        );
      }
    }

    // Optional: validate session exists and is consistent
    if (input.sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: input.sessionId },
        select: { id: true, tenantId: true, groupId: true },
      });
      if (!session) throw new BadRequestException("session not found");
      if (session.tenantId !== current.child.tenantId) {
        throw new BadRequestException(
          "session does not belong to the child's tenant",
        );
      }
      // If either the incoming groupId or the current groupId exists, ensure it matches the session's group (when session has one)
      const effectiveGroupId = input.groupId ?? current.groupId ?? undefined;
      if (
        session.groupId &&
        effectiveGroupId &&
        session.groupId !== effectiveGroupId
      ) {
        throw new BadRequestException("session is for a different group");
      }
    }

    const updated = await prisma.attendance.update({
      where: { id },
      data: {
        present: input.present ?? undefined,
        timestamp: input.timestamp ?? undefined,
        ...(input.groupId ? { group: { connect: { id: input.groupId } } } : {}),
        ...(input.sessionId
          ? { session: { connect: { id: input.sessionId } } }
          : {}),
      },
      select: SELECT,
    });
    return updated;
  }
}
