import { z } from "zod";

export const createGroupDto = z
  .object({
    name: z.string().min(1, "Group name is required"),
    tenantId: z.string().min(1, "Tenant ID is required"), // ensure group is tied to tenant
    minAge: z.number().min(0, "minAge must be greater than or equal to 0"),
    maxAge: z.number().min(0, "maxAge must be greater than or equal to minAge"),
  })
  .refine((data) => data.maxAge >= data.minAge, {
    message: "maxAge must be greater than or equal to minAge",
    path: ["maxAge"],
  });

export type CreateGroupDto = z.infer<typeof createGroupDto>;
