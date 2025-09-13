import { z } from "zod";

export const createTenantDto = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase, numbers and hyphens only")
    .min(3)
    .max(50),
  users: z.array(z.string().uuid()).optional(),
  groups: z.array(z.string().uuid()).optional(),
  children: z.array(z.string().uuid()).optional(),
  roles: z.array(z.string().uuid()).optional(),
});

export type CreateTenantDto = z.infer<typeof createTenantDto>;
