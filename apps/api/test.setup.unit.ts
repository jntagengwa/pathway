/// <reference types="jest" />
import { config } from "dotenv";
import path from "node:path";
import { execSync } from "node:child_process";
import type { PrismaClientType } from "@pathway/db";

// 1) Load test env first, then fallback to root .env (quiet to suppress logs)
config({ path: path.resolve(__dirname, "../../.env.test"), override: true });
config({ path: path.resolve(__dirname, "../../.env"), override: false });

// 2) Ensure unit tests point Prisma at TEST_DATABASE_URL; keep a base URL for runtime
const BASE_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
if (BASE_DATABASE_URL) {
  process.env.DATABASE_URL = BASE_DATABASE_URL;
}

let prisma: PrismaClientType | undefined;

beforeAll(async () => {
  // Helper to run prisma CLI commands under @pathway/db with the chosen DB env
  const run = (cmd: string, url: string) => {
    try {
      execSync(`pnpm --filter @pathway/db exec prisma ${cmd}`, {
        stdio: "inherit",
        env: {
          ...process.env,
          PRISMA_IGNORE_ENV_FILE: "1",
          DATABASE_URL: url,
        },
      });
      return true;
    } catch (e) {
      return e as unknown;
    }
  };

  const allowReset = process.env.UNIT_ALLOW_RESET === "true";

  if (allowReset) {
    // Use superuser DB when available to avoid permission issues on TRUNCATE/RESET.
    const resetUrl = process.env.SUPER_TEST_DATABASE ?? BASE_DATABASE_URL;
    if (!resetUrl) {
      throw new Error(
        "UNIT_ALLOW_RESET=true but no DATABASE_URL/TEST_DATABASE_URL/SUPER_TEST_DATABASE set",
      );
    }

    // Try a clean reset first. If the DB is brand new, `_prisma_migrations` may not exist (P1014).
    const firstAttempt = run(
      "migrate reset --force --skip-generate --skip-seed",
      resetUrl,
    );
    if (firstAttempt !== true) {
      const msg = String((firstAttempt as Error)?.message ?? firstAttempt);
      if (msg.includes("P1014")) {
        // Fresh DB: create migrations table, then reset
        const deployed = run("migrate deploy", resetUrl);
        if (deployed === true) {
          const secondAttempt = run(
            "migrate reset --force --skip-generate --skip-seed",
            resetUrl,
          );
          if (secondAttempt !== true) {
            // eslint-disable-next-line no-console
            console.warn(
              "[test.setup.unit] migrate reset failed after deploy (continuing):",
              secondAttempt,
            );
          }
        } else {
          // eslint-disable-next-line no-console
          console.warn(
            "[test.setup.unit] migrate deploy failed during P1014 fallback (continuing):",
            deployed,
          );
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn(
          "[test.setup.unit] migrate reset failed (continuing):",
          firstAttempt,
        );
      }
    }
  } else {
    // eslint-disable-next-line no-console
    console.log(
      "[test.setup.unit] Skipping prisma migrate reset; set UNIT_ALLOW_RESET=true to force a reset (requires privileged DB user).",
    );
  }

  // Import prisma AFTER DATABASE_URL is final and migrations are applied so the client binds to the unit DB
  type DBModule = { prisma: PrismaClientType };
  const db = (await import("@pathway/db")) as DBModule;
  prisma = db.prisma;
});

afterAll(async () => {
  if (!prisma) return;
  type WithDisconnect = { $disconnect?: () => Promise<void> };
  try {
    // Use a type guard and preserve `this` binding
    if (
      "$disconnect" in (prisma as WithDisconnect) &&
      typeof (prisma as WithDisconnect).$disconnect === "function"
    ) {
      await (prisma as WithDisconnect).$disconnect!.call(prisma);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[test.setup.unit] prisma.$disconnect() failed:", e);
  }
});
