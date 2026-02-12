import { z } from "zod";

export const upsertStaffAttendanceDto = z.object({
  staffUserId: z.string().uuid("staffUserId must be a valid uuid"),
  status: z.enum(["PRESENT", "ABSENT", "UNKNOWN"]),
});

export type UpsertStaffAttendanceDto = z.infer<typeof upsertStaffAttendanceDto>;
