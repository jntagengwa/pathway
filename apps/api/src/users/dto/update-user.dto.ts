import { z } from "zod";

export const updateUserDto = z.object({
  email: z.string().email().optional(),
  name: z.string().min(1).optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserDto>;
