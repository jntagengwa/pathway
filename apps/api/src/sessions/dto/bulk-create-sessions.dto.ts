import { z } from "zod";
import { Weekday } from "@pathway/db";

const weekdaySchema = z.nativeEnum(Weekday);
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const timeSchema = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Time must be HH:mm")
  .refine(
    (s) => {
      const [h, m] = s.split(":").map(Number);
      return h >= 0 && h <= 23 && m >= 0 && m <= 59;
    },
    { message: "Time must be valid HH:mm" },
  );

export const bulkCreateSessionsSchema = z
  .object({
    groupIds: z.array(z.string().uuid()).min(1, "Select at least one class"),
    startDate: dateSchema,
    endDate: dateSchema,
    daysOfWeek: z.array(weekdaySchema).min(1, "Select at least one day"),
    startTime: timeSchema,
    endTime: timeSchema,
    titlePrefix: z.string().max(200).optional(),
    assignmentUserIds: z.array(z.string().uuid()).optional(),
  })
  .refine((v) => v.startDate <= v.endDate, {
    message: "startDate must be on or before endDate",
    path: ["endDate"],
  })
  .refine(
    (v) => {
      const [sh, sm] = v.startTime.split(":").map(Number);
      const [eh, em] = v.endTime.split(":").map(Number);
      return sh * 60 + sm < eh * 60 + em;
    },
    { message: "endTime must be after startTime", path: ["endTime"] },
  );

export type BulkCreateSessionsDto = z.infer<typeof bulkCreateSessionsSchema>;
