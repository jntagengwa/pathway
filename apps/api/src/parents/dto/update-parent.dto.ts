import { z } from "zod";

export const updateParentSchema = z.object({
  displayName: z.string().trim().min(1).max(200).optional(),
  childIds: z.array(z.string().uuid()).optional(),
});

export type UpdateParentDto = z.infer<typeof updateParentSchema>;
