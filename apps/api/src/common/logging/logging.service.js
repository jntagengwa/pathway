var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable, Logger } from "@nestjs/common";
import { LOG_REDACTED_VALUE, SENSITIVE_KEYS } from "./logging.constants";
let LoggingService = class LoggingService {
    createLogger(component, base) {
        const nest = new Logger(component);
        const baseMeta = sanitizeMeta(base);
        const logWithLevel = (level, message, meta, trace) => {
            const payload = {
                message,
                component,
                ...baseMeta,
                ...sanitizeMeta(meta),
            };
            if (level === "error") {
                nest.error(payload, trace); // eslint-disable-line @typescript-eslint/no-explicit-any
            }
            else if (level === "warn") {
                nest.warn(payload);
            }
            else {
                nest.log(payload);
            }
        };
        return {
            info: (message, meta) => logWithLevel("log", message, meta),
            warn: (message, meta) => logWithLevel("warn", message, meta),
            error: (message, meta, trace) => logWithLevel("error", message, meta, trace),
        };
    }
    fromRequestContext(component, context) {
        const ctx = context?.getContext();
        return this.createLogger(component, {
            tenantId: ctx?.tenant.tenantId,
            orgId: ctx?.org.orgId,
            userId: ctx?.user.userId,
        });
    }
};
LoggingService = __decorate([
    Injectable()
], LoggingService);
export { LoggingService };
function sanitizeMeta(meta) {
    if (!meta)
        return {};
    const sanitized = {};
    for (const [key, value] of Object.entries(meta)) {
        if (value === undefined)
            continue;
        const lowerKey = key.toLowerCase();
        const isSensitive = SENSITIVE_KEYS.includes(lowerKey); // eslint-disable-line @typescript-eslint/no-explicit-any
        sanitized[key] = isSensitive ? LOG_REDACTED_VALUE : value;
    }
    return sanitized;
}
