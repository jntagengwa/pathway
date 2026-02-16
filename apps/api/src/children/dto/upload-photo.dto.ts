import { z } from "zod";

export const uploadChildPhotoDto = z.object({
  photoBase64: z.string().min(1, "Photo data is required"),
  photoContentType: z.string().optional().nullable(),
});

export type UploadChildPhotoDto = z.infer<typeof uploadChildPhotoDto>;
