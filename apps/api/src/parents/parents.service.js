var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from "@nestjs/common";
import { prisma } from "@pathway/db";
const listSelect = {
    id: true,
    name: true,
    email: true,
    hasFamilyAccess: true,
    children: {
        select: { id: true },
    },
};
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
};
let ParentsService = class ParentsService {
    async findAllForTenant(tenantId, orgId) {
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
    async findOneForTenant(tenantId, orgId, parentId) {
        void orgId; // reserved for future org/org-role scoping
        const parent = await prisma.user.findFirst({
            where: { id: parentId, tenantId, hasFamilyAccess: true },
            select: detailSelect,
        });
        if (!parent)
            return null;
        const children = parent.children.map((child) => ({
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
};
ParentsService = __decorate([
    Injectable()
], ParentsService);
export { ParentsService };
