import { PrismaClient } from "@prisma/client";

// Keep a single PrismaClient instance across hot-reloads in dev/test.
// We attach it to globalThis to avoid creating multiple connections.
const globalForPrisma = globalThis as unknown as {
  __prisma?: PrismaClient;
};

export const prisma: PrismaClient =
  globalForPrisma.__prisma ?? new PrismaClient();

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

// Re-export types & enums only
export type { Prisma, PrismaClient } from "@prisma/client";
