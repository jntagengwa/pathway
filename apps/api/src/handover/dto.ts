import { z } from "zod";

// Placeholder for future filters; currently unused but kept for symmetry.
export const handoverMyNextQueryDto = z.object({}).strict();
export type HandoverMyNextQueryDto = z.infer<typeof handoverMyNextQueryDto>;

export const handoverCreateDto = z
  .object({
    groupId: z.string().uuid("groupId must be a valid UUID"),
    handoverDate: z.coerce.date({
      required_error: "handoverDate is required",
      invalid_type_error: "handoverDate must be a valid date",
    }),
    contentJson: z.unknown(),
    changeSummary: z.string().max(500).optional(),
  })
  .strict();

export type HandoverCreateDto = z.infer<typeof handoverCreateDto>;

export const handoverUpdateDto = z
  .object({
    contentJson: z.unknown().optional(),
    status: z.enum(["DRAFT", "PENDING_APPROVAL"]).optional(),
    changeSummary: z.string().max(500).optional(),
  })
  .strict();

export type HandoverUpdateDto = z.infer<typeof handoverUpdateDto>;

export const handoverApproveDto = z
  .object({
    changeSummary: z.string().max(500).optional(),
  })
  .strict();

export type HandoverApproveDto = z.infer<typeof handoverApproveDto>;

export const handoverAdminListQueryDto = z
  .object({
    date: z.coerce.date().optional(),
    fromDate: z.coerce.date().optional(),
    toDate: z.coerce.date().optional(),
    groupId: z.string().uuid("groupId must be a valid UUID").optional(),
    status: z.enum(["DRAFT", "PENDING_APPROVAL", "APPROVED"]).optional(),
  })
  .strict();

export type HandoverAdminListQueryDto = z.infer<typeof handoverAdminListQueryDto>;

export const handoverRejectDto = z
  .object({
    status: z.enum(["DRAFT", "PENDING_APPROVAL"]).optional(),
    reason: z.string().max(500).optional(),
  })
  .strict();

export type HandoverRejectDto = z.infer<typeof handoverRejectDto>;

