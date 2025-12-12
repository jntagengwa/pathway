/**
 * AV30 Activity Types
 *
 * AV30 (Active Staff/Volunteers in last 30 days) is calculated based on
 * unique staff/volunteer users who have at least one qualifying activity
 * in the last 30 days.
 *
 * Qualifying activities include:
 * - Scheduled on rota/timetable (ASSIGNMENT_PUBLISHED)
 * - Responds to rota/assignment (ASSIGNMENT_ACCEPTED, ASSIGNMENT_DECLINED)
 * - Records or checks attendance (ATTENDANCE_RECORDED)
 *
 * Staff/volunteer roles: ADMIN, COORDINATOR, TEACHER, STAFF
 * (PARENT role is excluded from AV30 calculations)
 */

/**
 * Types of activities that qualify a staff/volunteer for AV30 counting.
 */
export enum Av30ActivityType {
  /**
   * Staff member records attendance for a child/session.
   * Emitted when attendance.create() or attendance.update() is called
   * by a staff user.
   */
  ATTENDANCE_RECORDED = "ATTENDANCE_RECORDED",

  /**
   * Staff member is scheduled on a rota/timetable (assignment created).
   * Emitted when an assignment is created for a staff user.
   */
  ASSIGNMENT_PUBLISHED = "ASSIGNMENT_PUBLISHED",

  /**
   * Staff member accepts an assignment (status changed to CONFIRMED).
   * Emitted when assignment status is updated to CONFIRMED.
   */
  ASSIGNMENT_ACCEPTED = "ASSIGNMENT_ACCEPTED",

  /**
   * Staff member declines an assignment (status changed to DECLINED).
   * Emitted when assignment status is updated to DECLINED.
   */
  ASSIGNMENT_DECLINED = "ASSIGNMENT_DECLINED",
}

/**
 * Parameters for recording an AV30 activity.
 */
export interface RecordAv30ActivityParams {
  /**
   * The type of activity being recorded.
   */
  activityType: Av30ActivityType;

  /**
   * The user ID of the staff/volunteer who performed the activity.
   * Must be a staff/volunteer user (not a parent).
   */
  staffUserId: string;

  /**
   * When the activity occurred (defaults to now if not provided).
   * Used for accurate AV30 calculations based on the 30-day window.
   */
  occurredAt?: Date;
}
