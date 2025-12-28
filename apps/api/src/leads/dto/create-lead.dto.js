import { z } from "zod";
const utmSchema = z
    .object({
    source: z.string().optional(),
    medium: z.string().optional(),
    campaign: z.string().optional(),
})
    .optional();
export const createDemoLeadDto = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    organisation: z.string().optional(),
    role: z.string().optional(),
    sector: z.string().optional(),
    message: z.string().optional(),
    utm: utmSchema,
});
export const createToolkitLeadDto = z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().optional(),
    organisation: z.string().optional(),
    role: z.string().optional(),
    sector: z.string().optional(),
    utm: utmSchema,
});
export const createTrialLeadDto = z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().optional(),
    organisation: z.string().optional(),
    sector: z.string().optional(),
    utm: utmSchema,
});
