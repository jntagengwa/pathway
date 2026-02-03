import { z } from "zod";

export const upsertSessionAttendanceDto = z.object({
  rows: z.array(
    z.object({
      childId: z.string().uuid("childId must be a valid uuid"),
      present: z.boolean(),
    }),
  ),
});

export type UpsertSessionAttendanceDto = z.infer<
  typeof upsertSessionAttendanceDto
>;
