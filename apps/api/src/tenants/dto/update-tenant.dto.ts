import { z } from "zod";

/**
 * Validates IANA timezone by attempting to use it in Intl.DateTimeFormat.
 */
function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export const updateTenantDto = z
  .object({
    name: z
      .string()
      .optional()
      .transform((s) => (s === undefined || s === "" ? undefined : s.trim()))
      .pipe(
        z
          .string()
          .min(2, "name must be at least 2 characters")
          .max(120, "name must be at most 120 characters")
          .optional(),
      )
      .optional(),
    timezone: z
      .string()
      .transform((s) => (s.trim() === "" ? null : s.trim()))
      .pipe(
        z
          .union([
            z.literal(null),
            z.string().refine(isValidTimezone, "Invalid IANA timezone"),
          ])
          .optional(),
      )
      .optional(),
  })
  .strict()
  .refine(
    (data) =>
      (data.name !== undefined && data.name.length > 0) ||
      data.timezone !== undefined,
    "At least one of name or timezone must be provided",
  );

export type UpdateTenantDto = z.infer<typeof updateTenantDto>;
