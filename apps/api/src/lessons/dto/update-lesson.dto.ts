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
  sessionId: z.string().uuid("sessionId must be a valid uuid").optional().nullable(),
  // Temporary: upload file as base64; empty string = clear stored file
  resourceFileBase64: z.string().optional().nullable(),
  resourceFileName: z.string().min(1).optional().nullable(),
});

export type UpdateLessonDto = z.infer<typeof updateLessonDto>;
