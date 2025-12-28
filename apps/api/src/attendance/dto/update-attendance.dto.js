import { z } from "zod";
export const updateAttendanceDto = z.object({
    childId: z.string().uuid().optional(),
    groupId: z.string().uuid().optional(),
    sessionId: z.string().uuid().optional(),
    present: z.boolean().optional(),
    timestamp: z
        .preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date) {
            return new Date(arg);
        }
    }, z.date())
        .optional(),
});
