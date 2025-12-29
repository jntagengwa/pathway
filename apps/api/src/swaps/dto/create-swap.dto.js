import { z } from "zod";
import { SwapStatus } from "@pathway/db";
export const createSwapDto = z.object({
    assignmentId: z
        .string({ required_error: "assignmentId is required" })
        .uuid("assignmentId must be a valid uuid"),
    fromUserId: z
        .string({ required_error: "fromUserId is required" })
        .uuid("fromUserId must be a valid uuid"),
    toUserId: z.string().uuid("toUserId must be a valid uuid").optional(),
    // Usually creation starts as REQUESTED; allow override for flexibility but validate enum
    status: z.nativeEnum(SwapStatus).optional(),
});
