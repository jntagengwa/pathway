import { z } from "zod";
export const createNoteDto = z.object({
    childId: z.string().uuid("childId must be a valid UUID"),
    text: z.string().trim().min(1, "text cannot be empty"),
});
