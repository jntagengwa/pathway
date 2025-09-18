import { z } from "zod";

// CreateConcern DTO for creating a new Concern record
// - childId: required UUID
// - summary: required, trimmed, non-empty
// - details: optional, trimmed, must be non-empty if provided
export const createConcernDto = z.object({
  childId: z.string().uuid("childId must be a valid UUID"),
  summary: z.string().trim().min(1, "summary cannot be empty"),
  details: z
    .string()
    .trim()
    .transform((v) => (v.length === 0 ? undefined : v))
    .optional(),
});

export type CreateConcernDto = z.infer<typeof createConcernDto>;
