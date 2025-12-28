import { z } from "zod";
export const updateUserDto = z.object({
    email: z.string().email().optional(),
    name: z.string().min(1).optional(),
    displayName: z.string().min(1).optional(),
    tenantId: z.string().min(1).optional(),
    hasServeAccess: z.boolean().optional(),
    hasFamilyAccess: z.boolean().optional(),
    children: z.array(z.string()).optional(), // child IDs to replace/set
});
