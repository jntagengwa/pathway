import { z } from "zod";

export const createAttendanceDto = z.object({
  childId: z
    .string({ required_error: "childId is required" })
    .uuid("childId must be a valid uuid"),
  groupId: z
    .string({ required_error: "groupId is required" })
    .uuid("groupId must be a valid uuid"),
  present: z.boolean({ required_error: "present is required" }),
  // Optional timestamp; if provided, coerce to Date and validate
  timestamp: z
    .union([
      z
        .string()
        .datetime()
        .transform((v) => new Date(v)),
      z.date(),
    ])
    .optional(),
});

export type CreateAttendanceDto = z.infer<typeof createAttendanceDto>;
