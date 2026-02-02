import { Injectable } from "@nestjs/common";
import { prisma } from "@pathway/db";
import { PathwayRequestContext, UserTenantRole } from "@pathway/auth";
import {
  Av30ActivityType,
  RecordAv30ActivityParams,
} from "@pathway/types/av30";

/**
 * Service for recording AV30-relevant staff activities.
 *
 * AV30 (Active Staff/Volunteers in last 30 days) counts unique staff/volunteer
 * users who have at least one qualifying activity in the last 30 days.
 *
 * This service records activities that will later be used by the nightly AV30
 * job to calculate usage counters.
 */
@Injectable()
export class Av30ActivityService {
  /**
   * Staff/volunteer roles that qualify for AV30 counting.
   * PARENT role is excluded.
   */
  private readonly STAFF_ROLES = [
    UserTenantRole.ADMIN,
    UserTenantRole.COORDINATOR,
    UserTenantRole.TEACHER,
    UserTenantRole.STAFF,
  ];

  /**
   * Check if a user has any staff/volunteer role (not just PARENT).
   */
  private isStaffUser(context: PathwayRequestContext): boolean {
    const roles = context.roles.tenant;
    return roles.some((role) => this.STAFF_ROLES.includes(role));
  }

  /**
   * Record an AV30 activity for a staff/volunteer user (using context).
   *
   * @param context - Request context containing tenant/org/user info
   * @param params - Activity parameters (type, staffUserId, occurredAt)
   */
  async recordActivity(
    context: PathwayRequestContext,
    params: RecordAv30ActivityParams,
  ): Promise<void> {
    const tenantId = context.currentTenantId;
    const orgId = context.currentOrgId;

    if (!tenantId || !orgId) {
      throw new Error(
        "PathwayRequestContext must have tenantId and orgId to record AV30 activity",
      );
    }

    return this.recordActivityWithIds(tenantId, orgId, params);
  }

  /**
   * Record an AV30 activity by tenant/org ids (for use from singleton services).
   *
   * Use this when the caller has tenantId/orgId but not PathwayRequestContext
   * (e.g. AssignmentsService as a singleton).
   */
  async recordActivityWithIds(
    tenantId: string,
    orgId: string,
    params: RecordAv30ActivityParams,
  ): Promise<void> {
    await prisma.staffActivity.create({
      data: {
        tenantId,
        orgId,
        staffUserId: params.staffUserId,
        activityType: params.activityType,
        occurredAt: params.occurredAt ?? new Date(),
      },
    });
  }

  /**
   * Record an AV30 activity for the current authenticated user (if they are staff).
   *
   * Convenience method that uses currentUserId from context.
   *
   * @param context - Request context
   * @param activityType - Type of activity
   * @param occurredAt - Optional timestamp (defaults to now)
   */
  async recordActivityForCurrentUser(
    context: PathwayRequestContext,
    activityType: Av30ActivityType,
    occurredAt?: Date,
  ): Promise<void> {
    const userId = context.currentUserId;
    if (!userId) {
      throw new Error(
        "PathwayRequestContext must have currentUserId to record activity for current user",
      );
    }

    // Only record if the current user is staff/volunteer
    if (!this.isStaffUser(context)) {
      // Silently skip - parents don't count for AV30
      return;
    }

    await this.recordActivity(context, {
      activityType,
      staffUserId: userId,
      occurredAt,
    });
  }
}
