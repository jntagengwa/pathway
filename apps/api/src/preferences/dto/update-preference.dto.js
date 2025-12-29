import { z } from "zod";
import { Weekday } from "@pathway/db";
export const updateVolunteerPreferenceDto = z
    .object({
    userId: z.string().uuid().optional(),
    tenantId: z.string().uuid().optional(),
    weekday: z.nativeEnum(Weekday).optional(),
    startMinute: z
        .number()
        .int("startMinute must be an integer")
        .min(0, "startMinute must be between 0 and 1439")
        .max(1439, "startMinute must be between 0 and 1439")
        .optional(),
    endMinute: z
        .number()
        .int("endMinute must be an integer")
        .min(1, "endMinute must be between 1 and 1440")
        .max(1440, "endMinute must be between 1 and 1440")
        .optional(),
})
    .refine((v) => v.startMinute === undefined ||
    v.endMinute === undefined ||
    v.endMinute > v.startMinute, {
    message: "endMinute must be greater than startMinute",
    path: ["endMinute"],
});
export const idParamDto = z.object({
    id: z
        .string({ required_error: "id is required" })
        .uuid("id must be a valid uuid"),
});
