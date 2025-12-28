var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from "@nestjs/common";
import { prisma } from "@pathway/db";
let AuditService = class AuditService {
    async recordEvent({ actorUserId, tenantId, orgId, entityType, entityId, action, metadata, }) {
        try {
            await prisma.auditEvent.create({
                data: {
                    actorUserId,
                    tenantId,
                    orgId,
                    entityType,
                    entityId: entityId ?? null,
                    action,
                    metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
                },
            });
        }
        catch (error) {
            // best-effort logging without failing caller
            console.warn("[AuditService] Failed to record audit event", error);
        }
    }
};
AuditService = __decorate([
    Injectable()
], AuditService);
export { AuditService };
