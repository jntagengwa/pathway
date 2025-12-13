import { prisma } from "@pathway/db";

export const DEFAULT_ATTENDANCE_RETENTION_DAYS = 730; // ~2 years
export const DEFAULT_STAFF_ACTIVITY_RETENTION_DAYS = 365;
export const DEFAULT_AUDIT_EVENT_RETENTION_DAYS = 365;

export type ResolvedRetentionPolicy = {
  attendanceRetentionDays: number;
  staffActivityRetentionDays: number;
  auditEventRetentionDays: number;
};

export class RetentionConfigService {
  async resolveForOrg(orgId: string): Promise<ResolvedRetentionPolicy> {
    type OrgRetentionPolicyDelegate = {
      findUnique: (args: {
        where: { orgId: string };
        select: {
          attendanceRetentionDays: true;
          staffActivityRetentionDays: true;
          auditEventRetentionDays: true;
        };
      }) => Promise<ResolvedRetentionPolicy | null>;
    };

    const policy = await (prisma as unknown as {
      orgRetentionPolicy: OrgRetentionPolicyDelegate;
    }).orgRetentionPolicy.findUnique({
      where: { orgId },
      select: {
        attendanceRetentionDays: true,
        staffActivityRetentionDays: true,
        auditEventRetentionDays: true,
      },
    });

    if (!policy) {
      return {
        attendanceRetentionDays: DEFAULT_ATTENDANCE_RETENTION_DAYS,
        staffActivityRetentionDays: DEFAULT_STAFF_ACTIVITY_RETENTION_DAYS,
        auditEventRetentionDays: DEFAULT_AUDIT_EVENT_RETENTION_DAYS,
      };
    }

    return policy;
  }
}

