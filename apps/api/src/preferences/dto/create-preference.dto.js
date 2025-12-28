import { z } from "zod";
import { Weekday } from "@pathway/db";
export const createVolunteerPreferenceDto = z
    .object({
    userId: z
        .string({ required_error: "userId is required" })
        .uuid("userId must be a valid uuid"),
    tenantId: z.string().uuid("tenantId must be a valid uuid").optional(),
    weekday: z.nativeEnum(Weekday, {
        required_error: "weekday is required",
        invalid_type_error: "weekday must be a valid Weekday",
    }),
    startMinute: z
        .number({ required_error: "startMinute is required" })
        .int("startMinute must be an integer")
        .min(0, "startMinute must be between 0 and 1439")
        .max(1439, "startMinute must be between 0 and 1439"),
    endMinute: z
        .number({ required_error: "endMinute is required" })
        .int("endMinute must be an integer")
        .min(1, "endMinute must be between 1 and 1440")
        .max(1440, "endMinute must be between 1 and 1440"),
})
    .refine((v) => v.endMinute > v.startMinute, {
    message: "endMinute must be greater than startMinute",
    path: ["endMinute"],
});
