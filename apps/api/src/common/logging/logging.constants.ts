export const LOG_REDACTED_VALUE = "[REDACTED]";

// Keys that should be redacted when present in metadata
export const SENSITIVE_KEYS = [
  "email",
  "fullName",
  "name",
  "token",
  "authorization",
  "password",
  "sessionId",
  "customerId",
  "paymentMethodId",
  "billingEmail",
] as const;

export type SensitiveKey = (typeof SENSITIVE_KEYS)[number];

