import { z } from "zod";

// Create Lesson DTO
// Accepts weekOf as ISO string or Date and normalizes to Date
export const createLessonDto = z.object({
  tenantId: z
    .string({ required_error: "tenantId is required" })
    .uuid("tenantId must be a valid uuid"),
  groupId: z.string().uuid("groupId must be a valid uuid").optional(),
  title: z
    .string({ required_error: "title is required" })
    .min(1, "title cannot be empty"),
  description: z.string().optional(),
  fileKey: z.string().min(1, "fileKey cannot be empty").optional(),
  weekOf: z.coerce.date({ required_error: "weekOf is required" }),
});

export type CreateLessonDto = z.infer<typeof createLessonDto>;
