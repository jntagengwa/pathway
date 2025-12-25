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
export var Av30ActivityType;
(function (Av30ActivityType) {
    /**
     * Staff member records attendance for a child/session.
     * Emitted when attendance.create() or attendance.update() is called
     * by a staff user.
     */
    Av30ActivityType["ATTENDANCE_RECORDED"] = "ATTENDANCE_RECORDED";
    /**
     * Staff member is scheduled on a rota/timetable (assignment created).
     * Emitted when an assignment is created for a staff user.
     */
    Av30ActivityType["ASSIGNMENT_PUBLISHED"] = "ASSIGNMENT_PUBLISHED";
    /**
     * Staff member accepts an assignment (status changed to CONFIRMED).
     * Emitted when assignment status is updated to CONFIRMED.
     */
    Av30ActivityType["ASSIGNMENT_ACCEPTED"] = "ASSIGNMENT_ACCEPTED";
    /**
     * Staff member declines an assignment (status changed to DECLINED).
     * Emitted when assignment status is updated to DECLINED.
     */
    Av30ActivityType["ASSIGNMENT_DECLINED"] = "ASSIGNMENT_DECLINED";
})(Av30ActivityType || (Av30ActivityType = {}));
