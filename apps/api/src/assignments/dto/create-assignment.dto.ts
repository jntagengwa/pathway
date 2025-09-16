import { z } from "zod";
import { AssignmentStatus, Role } from "@pathway/db";

export const createAssignmentDto = z.object({
  sessionId: z
    .string({
      required_error: "sessionId is required",
    })
    .uuid("sessionId must be a valid uuid"),
  userId: z
    .string({
      required_error: "userId is required",
    })
    .uuid("userId must be a valid uuid"),
  role: z.nativeEnum(Role, {
    required_error: "role is required",
  }),
  status: z.nativeEnum(AssignmentStatus).optional(),
});

export type CreateAssignmentDto = z.infer<typeof createAssignmentDto>;
