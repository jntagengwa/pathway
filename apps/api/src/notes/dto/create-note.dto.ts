import { z } from "zod";

export const createNoteDto = z.object({
  childId: z.string().uuid("childId must be a valid UUID"),
  authorId: z.string().uuid("authorId must be a valid UUID"),
  text: z.string().trim().min(1, "text cannot be empty"),
});

export type CreateNoteDto = z.infer<typeof createNoteDto>;
