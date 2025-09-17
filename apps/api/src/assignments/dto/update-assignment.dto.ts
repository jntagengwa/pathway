import { z } from "zod";
import { AssignmentStatus, Role } from "@pathway/db";

export const updateAssignmentDto = z.object({
  sessionId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  role: z.nativeEnum(Role).optional(),
  status: z.nativeEnum(AssignmentStatus).optional(),
});

export type UpdateAssignmentDto = z.infer<typeof updateAssignmentDto>;
