import { z } from "zod";

export const createGroupDto = z.object({
  name: z.string().min(1, "Group name is required").trim(),
  tenantId: z.string().min(1, "Tenant ID is required"),
  minAge: z.number().int().min(0).optional().nullable(),
  maxAge: z.number().int().min(0).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional().nullable(),
});

export type CreateGroupDto = z.infer<typeof createGroupDto>;
