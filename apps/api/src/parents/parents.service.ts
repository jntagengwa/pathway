import { Injectable } from "@nestjs/common";
import { prisma } from "@pathway/db";
import type {
  ParentChildSummaryDto,
  ParentDetailDto,
  ParentSummaryDto,
} from "./dto/parents.dto";

const listSelect = {
  id: true,
  name: true,
  email: true,
  hasFamilyAccess: true,
  children: {
    select: { id: true },
  },
} as const;

const detailSelect = {
  id: true,
  name: true,
  email: true,
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
  async findAllForTenant(
    tenantId: string,
    orgId: string,
  ): Promise<ParentSummaryDto[]> {
    void orgId; // reserved for future org/org-role scoping
    const parents = await prisma.user.findMany({
      where: { tenantId, hasFamilyAccess: true },
      select: listSelect,
      orderBy: [{ name: "asc" }, { email: "asc" }],
    });

    return parents.map((parent) => ({
      id: parent.id,
      fullName: parent.name ?? "",
      email: parent.email ?? null,
      childrenCount: parent.children.length,
    }));
  }

  async findOneForTenant(
    tenantId: string,
    orgId: string,
    parentId: string,
  ): Promise<ParentDetailDto | null> {
    void orgId; // reserved for future org/org-role scoping
    const parent = await prisma.user.findFirst({
      where: { id: parentId, tenantId, hasFamilyAccess: true },
      select: detailSelect,
    });

    if (!parent) return null;

    const children: ParentChildSummaryDto[] = parent.children.map((child) => ({
      id: child.id,
      fullName: [child.firstName, child.lastName]
        .filter(Boolean)
        .join(" ")
        .trim(),
    }));

    return {
      id: parent.id,
      fullName: parent.name ?? "",
      email: parent.email ?? null,
      children,
    };
  }
}
