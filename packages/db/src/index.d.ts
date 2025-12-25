import { PrismaClient, Prisma } from "@prisma/client";
export declare const prisma: PrismaClient;
export declare function closePrisma(): Promise<void>;
/**
 * Utility for e2e/unit tests: truncate all tables and reset identity sequences.
 * Uses CASCADE, so order is resilient to FK graphs.
 * IMPORTANT: keep this in sync with Prisma schema when new tables are added.
 */
export declare function resetDatabase(): Promise<void>;
export type { PrismaClient as PrismaClientType } from "@prisma/client";
export { AssignmentStatus, Role, Weekday, SwapStatus, SubscriptionStatus, BillingProvider, PendingOrderStatus, OrgRole, SiteRole, } from "@prisma/client";
export { Prisma };
export declare function withTenantRlsContext<T>(tenantId: string, orgId: string | null, callback: (client: Prisma.TransactionClient) => Promise<T>): Promise<T>;
//# sourceMappingURL=index.d.ts.map