import { z } from "zod";

export const updateGroupDto = z
  .object({
    name: z.string().min(1).optional(),
    minAge: z.number().int().min(0).optional(),
    maxAge: z.number().int().min(0).optional(),
  })
  .superRefine((v, ctx) => {
    if (
      v.minAge !== undefined &&
      v.maxAge !== undefined &&
      v.minAge > v.maxAge
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "minAge must be less than or equal to maxAge",
        path: ["minAge"],
      });
    }
  });

export type UpdateGroupDto = z.infer<typeof updateGroupDto>;
