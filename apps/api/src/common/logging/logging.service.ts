import { Injectable, Logger } from "@nestjs/common";
import { PathwayRequestContext } from "@pathway/auth";
import { LOG_REDACTED_VALUE, SENSITIVE_KEYS } from "./logging.constants";

export type LogLevel = "log" | "warn" | "error";

export type LogContext = {
  tenantId?: string | null;
  orgId?: string | null;
  userId?: string | null;
  [key: string]: unknown;
};

export interface StructuredLogger {
  info(message: string, meta?: LogContext): void;
  warn(message: string, meta?: LogContext): void;
  error(message: string, meta?: LogContext, trace?: unknown): void;
}

@Injectable()
export class LoggingService {
  createLogger(component: string, base?: LogContext): StructuredLogger {
    const nest = new Logger(component);
    const baseMeta = sanitizeMeta(base);

    const logWithLevel = (
      level: LogLevel,
      message: string,
      meta?: LogContext,
      trace?: unknown,
    ) => {
      const payload = {
        message,
        component,
        ...baseMeta,
        ...sanitizeMeta(meta),
      };
      if (level === "error") {
        nest.error(payload, trace as any); // eslint-disable-line @typescript-eslint/no-explicit-any
      } else if (level === "warn") {
        nest.warn(payload);
      } else {
        nest.log(payload);
      }
    };

    return {
      info: (message: string, meta?: LogContext) =>
        logWithLevel("log", message, meta),
      warn: (message: string, meta?: LogContext) =>
        logWithLevel("warn", message, meta),
      error: (message: string, meta?: LogContext, trace?: unknown) =>
        logWithLevel("error", message, meta, trace),
    };
  }

  fromRequestContext(
    component: string,
    context?: PathwayRequestContext,
  ): StructuredLogger {
    const ctx = context?.getContext();
    return this.createLogger(component, {
      tenantId: ctx?.tenant.tenantId,
      orgId: ctx?.org.orgId,
      userId: ctx?.user.userId,
    });
  }
}

function sanitizeMeta(meta?: LogContext): Record<string, unknown> {
  if (!meta) return {};
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (value === undefined) continue;
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.includes(lowerKey as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    sanitized[key] = isSensitive ? LOG_REDACTED_VALUE : value;
  }
  return sanitized;
}

