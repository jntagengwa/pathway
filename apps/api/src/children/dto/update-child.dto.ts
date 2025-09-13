import { z } from "zod";

export const updateChildDto = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  allergies: z.string().trim().min(1).optional(),
  photoKey: z.string().min(1).optional(),
  notes: z.string().optional(),
  disabilities: z.array(z.string().min(1)).optional(),

  tenantId: z.string().uuid().optional(), // usually immutable, but kept here for safety
  groupId: z.string().uuid().nullable().optional(), // nullable allows explicit disconnect
  guardianIds: z.array(z.string().uuid()).optional(),
});

export type UpdateChildDto = z.infer<typeof updateChildDto>;
