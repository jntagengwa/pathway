import { z } from "zod";

export const createChildDto = z.object({
  firstName: z.string().trim().min(1, "firstName is required").max(100),
  lastName: z.string().trim().min(1, "lastName is required").max(100),
  allergies: z.string().trim().min(1, "allergies is required"),
  tenantId: z.string().uuid(),

  photoKey: z.string().min(1).optional(),
  notes: z.string().optional(),
  disabilities: z.array(z.string().min(1)).optional(),

  groupId: z.string().uuid().optional(),
  guardianIds: z.array(z.string().uuid()).optional(),
});

export type CreateChildDto = z.infer<typeof createChildDto>;
