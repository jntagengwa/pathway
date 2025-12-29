import { z } from "zod";
export const updateLessonDto = z.object({
    // All fields optional for PATCH semantics
    title: z.string().min(1, "title cannot be empty").optional(),
    description: z.string().min(1).optional().nullable(),
    fileKey: z.string().min(1, "fileKey cannot be empty").optional().nullable(),
    groupId: z
        .string()
        .uuid("groupId must be a valid uuid")
        .optional()
        .nullable(),
    weekOf: z.coerce.date().optional(),
});
