import { z } from "zod";

export const createTenantDto = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "slug must be lowercase, numbers and hyphens only")
    .min(3)
    .max(50),
});

export type CreateTenantDto = z.infer<typeof createTenantDto>;
