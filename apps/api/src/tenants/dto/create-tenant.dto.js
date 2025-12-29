import { z } from "zod";
export const createTenantDto = z.object({
    name: z.string().min(2).max(100),
    slug: z
        .string()
        .regex(/^[a-z0-9-]+$/, "slug must be lowercase, numbers and hyphens only")
        .min(3)
        .max(50),
    orgId: z.string().uuid("orgId must be a valid UUID"),
    attendanceRetentionDays: z.number().int().positive().max(3650).optional(),
    ratioConfig: z.record(z.string(), z.unknown()).optional(),
    users: z.array(z.string().uuid()).optional(),
    groups: z.array(z.string().uuid()).optional(),
    children: z.array(z.string().uuid()).optional(),
    roles: z.array(z.string().uuid()).optional(),
});
