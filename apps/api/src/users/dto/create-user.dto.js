import { z } from "zod";
export const createUserDto = z.object({
    email: z.string().email(),
    name: z.string().min(1),
    tenantId: z.string().min(1), // cuid/uuid depending on your schema
    hasServeAccess: z.boolean().optional().default(false),
    hasFamilyAccess: z.boolean().optional().default(false),
    children: z.array(z.string()).optional(), // child IDs to link as parent
});
