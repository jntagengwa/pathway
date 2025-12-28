import { z } from "zod";
export const updateNoteDto = z.object({
    text: z.string().trim().min(1, "text cannot be empty").optional(),
});
