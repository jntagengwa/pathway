import { Injectable } from "@nestjs/common";
import { prisma } from "@pathway/db";
import type { RecordAuditEventInput } from "./audit.types";

@Injectable()
export class AuditService {
  async recordEvent({
    actorUserId,
    tenantId,
    orgId,
    entityType,
    entityId,
    action,
    metadata,
  }: RecordAuditEventInput): Promise<void> {
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
    } catch (error) {
      // best-effort logging without failing caller
      console.warn("[AuditService] Failed to record audit event", error);
    }
  }
}
