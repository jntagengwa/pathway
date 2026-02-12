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

export type CreateDemoLeadDto = z.infer<typeof createDemoLeadDto>;

export const createToolkitLeadDto = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  orgName: z.string().optional(),
  organisation: z.string().optional(), // alias for orgName (legacy)
  role: z.string().optional(),
  sector: z.string().optional(),
  consentMarketing: z.literal(true, {
    errorMap: () => ({ message: "Consent to be contacted is required" }),
  }),
  utm: utmSchema,
});

export type CreateToolkitLeadDto = z.infer<typeof createToolkitLeadDto>;

export const createTrialLeadDto = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
  organisation: z.string().optional(),
  sector: z.string().optional(),
  utm: utmSchema,
});

export type CreateTrialLeadDto = z.infer<typeof createTrialLeadDto>;

const riskAreaSchema = z.object({
  area: z.string(),
  severity: z.string(),
  notes: z.string().optional(),
});

export const createReadinessLeadDto = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  organisation: z.string().optional(),
  sector: z.string().optional(),
  answers: z.record(z.union([z.string(), z.number(), z.array(z.string())])).optional(),
  score: z.number().optional(),
  band: z.string().optional(),
  riskAreas: z.array(riskAreaSchema).optional(),
  utm: utmSchema,
});

export type CreateReadinessLeadDto = z.infer<typeof createReadinessLeadDto>;

