import { z } from "zod";

const MAX_RESOURCE_FILE_BYTES = 10 * 1024 * 1024; // 10MB

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
  sessionId: z.string().uuid("sessionId must be a valid uuid").optional(),
  // Temporary: upload file as base64 until S3; stored as bytes in DB
  resourceFileBase64: z.string().optional(),
  resourceFileName: z.string().min(1).optional(),
});

export type CreateLessonDto = z.infer<typeof createLessonDto>;

export function decodeResourceFile(
  base64: string | undefined,
  fileName: string | undefined,
): { buffer: Buffer; fileName: string } | null {
  if (!base64 || !base64.trim()) return null;
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length > MAX_RESOURCE_FILE_BYTES) {
    throw new Error(
      `Resource file must be at most ${MAX_RESOURCE_FILE_BYTES / 1024 / 1024}MB`,
    );
  }
  return {
    buffer,
    fileName: (fileName && fileName.trim()) || "resource",
  };
}
