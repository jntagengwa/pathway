import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@pathway/db";
import type { ChildDsarExport } from "./dsar.types";

@Injectable()
export class DsarService {
  /**
   * Export all data for a child within the caller's tenant.
   * RLS enforces tenant isolation; we also filter by tenantId defensively.
   */
  async exportChild(childId: string, tenantId: string): Promise<ChildDsarExport> {
    const child = await prisma.child.findFirst({
      where: { id: childId, tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        allergies: true,
        disabilities: true,
        notes: true,
        group: {
          select: { id: true, name: true, minAge: true, maxAge: true },
        },
      },
    });

    if (!child) {
      throw new NotFoundException("Child not found");
    }

    const parents = (
      await prisma.user.findMany({
      where: {
        tenantId,
        children: { some: { id: childId } },
      },
      select: {
        id: true,
        email: true,
        name: true,
        hasFamilyAccess: true,
      },
      })
    ).map((parent) => ({
      ...parent,
      email: parent.email ?? "",
    }));

    const attendance = await prisma.attendance.findMany({
      where: { childId },
      select: {
        id: true,
        groupId: true,
        sessionId: true,
        present: true,
        timestamp: true,
      },
      orderBy: { timestamp: "desc" },
    });

    const notes = await prisma.childNote.findMany({
      where: { childId },
      select: {
        id: true,
        text: true,
        authorId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const concerns = await prisma.concern.findMany({
      where: { childId, deletedAt: null },
      select: {
        id: true,
        summary: true,
        details: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const sessionIds = attendance
      .map((a) => a.sessionId)
      .filter((id): id is string => Boolean(id));

    const sessions = sessionIds.length
      ? await prisma.session.findMany({
          where: { id: { in: Array.from(new Set(sessionIds)) }, tenantId },
          select: {
            id: true,
            groupId: true,
            startsAt: true,
            endsAt: true,
            title: true,
          },
          orderBy: { startsAt: "desc" },
        })
      : [];

    return {
      child,
      parents,
      attendance,
      notes,
      concerns,
      sessions,
    };
  }
}

