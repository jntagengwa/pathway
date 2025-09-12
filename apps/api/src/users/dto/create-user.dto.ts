import { z } from "zod";

export const createUserDto = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  tenantId: z.string().min(1), // cuid/uuid depending on your schema
});

export type CreateUserDto = z.infer<typeof createUserDto>;
