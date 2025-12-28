import { z } from "zod";
export const updateAnnouncementDto = z.object({
    title: z.string().min(1, "title cannot be empty").optional(),
    body: z.string().min(1, "body cannot be empty").optional(),
    audience: z.enum(["ALL", "PARENTS", "STAFF"]).optional(),
    publishedAt: z.coerce.date().optional().nullable(),
});
