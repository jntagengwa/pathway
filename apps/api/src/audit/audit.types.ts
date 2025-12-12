export enum AuditEntityType {
  CONCERN = "CONCERN",
  CHILD_NOTE = "CHILD_NOTE",
}

export enum AuditAction {
  CREATED = "CREATED",
  UPDATED = "UPDATED",
  VIEWED = "VIEWED",
  DELETED = "DELETED",
}

export interface RecordAuditEventInput {
  actorUserId: string;
  tenantId: string;
  orgId: string;
  entityType: AuditEntityType;
  action: AuditAction;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

