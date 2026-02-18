import { z } from "zod";

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

export const updateGroupDto = z
  .object({
    name: z.string().min(1).trim().optional(),
    minAge: z.number().int().min(0).optional().nullable(),
    maxAge: z.number().int().min(0).optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
    color: z
      .union([z.string().regex(hexColorRegex), z.literal("")])
      .optional()
      .transform((v) =>
        v === undefined ? undefined : v === "" || !v ? null : v,
      ),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().optional().nullable(),
  })
  .superRefine((v, ctx) => {
    const min = v.minAge ?? null;
    const max = v.maxAge ?? null;
    if (
      min !== null &&
      max !== null &&
      typeof min === "number" &&
      typeof max === "number" &&
      min > max
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "minAge must be less than or equal to maxAge",
        path: ["minAge"],
      });
    }
  });

export type UpdateGroupDto = z.infer<typeof updateGroupDto>;
