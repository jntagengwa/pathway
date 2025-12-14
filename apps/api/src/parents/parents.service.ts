import { Injectable } from "@nestjs/common";
import { prisma } from "@pathway/db";
import type { ParentDetailDto, ParentSummaryDto } from "./dto/parent.dto";

const parentSelect = {
  id: true,
  email: true,
  name: true,
  hasFamilyAccess: true,
  children: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
} as const;

@Injectable()
export class ParentsService {
  /**
   * Minimal parent/guardian listing for admin/staff use.
   * Explicit tenant filter in addition to Postgres RLS.
   */
  async findAllForTenant(
    tenantId: string,
    _orgId: string,
  ): Promise<ParentSummaryDto[]> {
    // TODO: include org-level scoping once user/org joins are modelled.
    const parents = await prisma.user.findMany({
      where: { tenantId, hasFamilyAccess: true },
      select: parentSelect,
      orderBy: [{ name: "asc" }, { email: "asc" }],
    });

    return parents.map((parent) => ({
      id: parent.id,
      fullName: parent.name ?? "",
      email: parent.email ?? null,
      phone: null,
      isPrimaryContact: null,
      childrenCount: parent.children.length,
    }));
  }

  async findOneForTenant(
    tenantId: string,
    _orgId: string,
    parentId: string,
  ): Promise<ParentDetailDto | null> {
    // TODO: include org-level scoping once user/org joins are modelled.
    const parent = await prisma.user.findFirst({
      where: { id: parentId, tenantId, hasFamilyAccess: true },
      select: parentSelect,
    });

    if (!parent) return null;

    return {
      id: parent.id,
      fullName: parent.name ?? "",
      email: parent.email ?? null,
      phone: null,
      isPrimaryContact: null,
      childrenCount: parent.children.length,
      children: parent.children.map((child) => ({
        id: child.id,
        fullName: `${child.firstName} ${child.lastName}`.trim(),
      })),
    };
  }
}
