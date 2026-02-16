import { z } from "zod";

export const uploadAssetDto = z.object({
  fileBase64: z.string().min(1, "File data is required"),
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  type: z.enum(["THUMBNAIL", "HEADER", "INLINE"]).default("INLINE"),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export type UploadAssetDto = z.infer<typeof uploadAssetDto>;
