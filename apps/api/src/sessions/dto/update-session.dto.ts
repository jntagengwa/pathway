import { z } from "zod";

export const updateSessionSchema = z.object({
  tenantId: z.string().optional(),
  groupId: z.string().optional(),
  startsAt: z.date().optional(),
  endsAt: z.date().optional(),
  title: z.string().optional(),
});

export type UpdateSessionDto = z.infer<typeof updateSessionSchema>;
