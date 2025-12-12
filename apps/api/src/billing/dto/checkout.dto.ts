import { z } from "zod";

// Keep aligned with orgs/dto/register-org.dto.ts but do not persist in Prisma
export const billingAddressDto = z
  .object({
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    postalCode: z.string().min(2).max(20),
    country: z.string().length(2, "ISO 2-letter country code"),
  })
  .partial()
  .strict();

export const checkoutDto = z
  .object({
    // Billing provider adapter. MVP supports Stripe only.
    provider: z.enum(["stripe"]).default("stripe"),

    // Target org that is purchasing (or upgrading) a plan
    orgId: z.string().uuid("orgId must be a valid UUID"),

    // Commercial plan (e.g., trial, starter, pro, enterprise)
    planCode: z.string().min(1, "planCode is required"),

    // Checkout session behavior
    mode: z.enum(["subscription", "setup"]).default("subscription"),
    seats: z.number().int().positive().max(1000).default(1),
    trialDays: z.number().int().min(0).max(60).optional(),

    // Redirect URLs required by hosted checkout
    successUrl: z.string().url("successUrl must be a valid URL"),
    cancelUrl: z.string().url("cancelUrl must be a valid URL"),

    // Optional customer/payment hints for provider handoff
    customerId: z.string().min(1).optional(),
    paymentMethodId: z.string().min(1).optional(),
    billingEmail: z.string().email().optional(),
    billingAddress: billingAddressDto.optional(),

    // Provider metadata passthrough (string→string only to keep it simple)
    metadata: z.record(z.string(), z.string()).optional(),
  })
  .strict()
  // If mode is 'setup', we require either customerId or billingEmail to tie the setup intent
  .refine(
    (v) =>
      v.mode === "setup" ? Boolean(v.customerId || v.billingEmail) : true,
    "For mode='setup', either customerId or billingEmail is required",
  );

export type CheckoutDto = z.infer<typeof checkoutDto>;
export type BillingAddressDto = z.infer<typeof billingAddressDto>;
