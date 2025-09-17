// ESM/CJS/Jest-safe Prisma bootstrap that won't break existing tests
import type { PrismaClient as PrismaClientType } from "@prisma/client";
import * as PrismaNS from "@prisma/client";

// Extract ctor via namespace import to avoid "PrismaClient is not a constructor" in some runtimes
const PrismaClientCtor = (
  PrismaNS as unknown as { PrismaClient: new () => PrismaClientType }
).PrismaClient;

// Keep a single PrismaClient instance across hot-reloads in dev/test.
// We attach it to globalThis to avoid creating multiple connections.
const globalForPrisma = globalThis as unknown as {
  __prisma?: PrismaClientType;
};

export const prisma: PrismaClientType =
  globalForPrisma.__prisma ?? new PrismaClientCtor();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma = prisma;
}

// Small helper so test teardown (or scripts) can cleanly disconnect
export async function closePrisma() {
  await prisma.$disconnect();
}

// Utility for unit tests: truncate all tables and reset identity sequences.
// Adjust table names as needed for your schema.
export async function resetDatabase() {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Attendance","Assignment","Session","ChildNote","Concern","Child","Group","UserTenantRole","User","Tenant" RESTART IDENTITY CASCADE',
  );
}

// Re-export types & enums only (public API unchanged)
export type { Prisma, PrismaClient } from "@prisma/client";
export { AssignmentStatus, Role, Weekday, SwapStatus } from "@prisma/client";
