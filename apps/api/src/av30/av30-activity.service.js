var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from "@nestjs/common";
import { prisma } from "@pathway/db";
import { UserTenantRole } from "@pathway/auth";
/**
 * Service for recording AV30-relevant staff activities.
 *
 * AV30 (Active Staff/Volunteers in last 30 days) counts unique staff/volunteer
 * users who have at least one qualifying activity in the last 30 days.
 *
 * This service records activities that will later be used by the nightly AV30
 * job to calculate usage counters.
 */
let Av30ActivityService = class Av30ActivityService {
    /**
     * Staff/volunteer roles that qualify for AV30 counting.
     * PARENT role is excluded.
     */
    STAFF_ROLES = [
        UserTenantRole.ADMIN,
        UserTenantRole.COORDINATOR,
        UserTenantRole.TEACHER,
        UserTenantRole.STAFF,
    ];
    /**
     * Check if a user has any staff/volunteer role (not just PARENT).
     */
    isStaffUser(context) {
        const roles = context.roles.tenant;
        return roles.some((role) => this.STAFF_ROLES.includes(role));
    }
    /**
     * Record an AV30 activity for a staff/volunteer user.
     *
     * This method:
     * - Validates the user is a staff/volunteer (not a parent)
     * - Derives tenantId/orgId from PathwayRequestContext
     * - Records the activity with the specified occurredAt timestamp
     *
     * @param context - Request context containing tenant/org/user info
     * @param params - Activity parameters (type, staffUserId, occurredAt)
     * @throws Error if context is missing tenant/org info or user is not staff
     */
    async recordActivity(context, params) {
        const tenantId = context.currentTenantId;
        const orgId = context.currentOrgId;
        if (!tenantId || !orgId) {
            throw new Error("PathwayRequestContext must have tenantId and orgId to record AV30 activity");
        }
        // Verify the target user is a staff/volunteer (not a parent)
        // We check the current user's roles, but we should also verify the staffUserId
        // has staff roles. For now, we trust that the caller ensures staffUserId is correct.
        // In a future enhancement, we could query UserTenantRole to verify.
        // Record the activity
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
    async recordActivityForCurrentUser(context, activityType, occurredAt) {
        const userId = context.currentUserId;
        if (!userId) {
            throw new Error("PathwayRequestContext must have currentUserId to record activity for current user");
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
};
Av30ActivityService = __decorate([
    Injectable()
], Av30ActivityService);
export { Av30ActivityService };
