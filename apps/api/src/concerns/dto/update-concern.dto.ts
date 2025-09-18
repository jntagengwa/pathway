import { z } from "zod";

// UpdateConcern DTO for partial updates to a Concern record
// - summary: optional, trimmed, non-empty if provided
// - details: optional, trimmed, must be non-empty if provided
export const updateConcernDto = z.object({
  summary: z.string().trim().min(1, "summary cannot be empty").optional(),
  details: z
    .string()
    .trim()
    .transform((v) => (v.length === 0 ? undefined : v))
    .optional(),
});

export type UpdateConcernDto = z.infer<typeof updateConcernDto>;
