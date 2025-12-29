import { z } from "zod";
export const createAnnouncementDto = z.object({
    tenantId: z.string().uuid("tenantId must be a valid UUID"),
    title: z.string().min(1, "title cannot be empty"),
    body: z.string().min(1, "body cannot be empty"),
    audience: z.enum(["ALL", "PARENTS", "STAFF"]).default("ALL"),
    publishedAt: z.coerce.date().optional().nullable(),
});
