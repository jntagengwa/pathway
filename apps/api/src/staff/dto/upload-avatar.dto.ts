import { z } from "zod";

export const uploadAvatarDto = z.object({
  photoBase64: z.string().min(1, "Photo data is required"),
  photoContentType: z.string().optional().nullable(),
});

export type UploadAvatarDto = z.infer<typeof uploadAvatarDto>;
