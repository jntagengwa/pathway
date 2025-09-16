/// <reference types="jest" />
import { config } from "dotenv";
import path from "node:path";
import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import type { PrismaClient } from "@pathway/db";

// 1) Load test env first, then fallback to root .env
config({ path: path.resolve(__dirname, "../../.env.test"), override: true });
config({ path: path.resolve(__dirname, "../../.env"), override: false });

// 2) Point Prisma at the dedicated E2E database
if (!process.env.E2E_DATABASE_URL) {
  throw new Error("E2E_DATABASE_URL is not set (check .env.test)");
}
// Use a per-worker Prisma schema to isolate tests running in parallel.
// This avoids cross-test interference and lets each Jest worker push its own schema safely.
const WORKER_ID = process.env.JEST_WORKER_ID ?? "1";
const E2E_SCHEMA = `e2e_w${WORKER_ID}`;

function withSchema(url: string, schema: string) {
  // Append ?schema=... (or &schema=...) while preserving existing query/hash if present.
  const hasQuery = url.includes("?");
  const hasHash = url.includes("#");
  if (hasHash) {
    const [base, hash] = url.split("#", 2);
    return `${base}${hasQuery ? "&" : "?"}schema=${schema}#${hash}`;
  }
  return `${url}${hasQuery ? "&" : "?"}schema=${schema}`;
}

const E2E_URL = process.env.E2E_DATABASE_URL as string;
process.env.DATABASE_URL = withSchema(E2E_URL, E2E_SCHEMA);

// Pre-set deterministic tenant IDs in env so specs can read them at module load time
const TENANT_A_ID = process.env.E2E_TENANT_ID ?? randomUUID();
const TENANT_B_ID = process.env.E2E_TENANT2_ID ?? randomUUID();
// We'll finalize these after we check for existing slugs in the DB
process.env.E2E_TENANT_ID = TENANT_A_ID;
process.env.E2E_TENANT2_ID = TENANT_B_ID;

// Ensure the worker-local schema is in sync before we import the Prisma client
try {
  execSync(
    "pnpm --filter @pathway/db exec prisma db push --force-reset --accept-data-loss",
    {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL as string, // already includes unique ?schema=
      },
    },
  );
} catch (e2) {
  // eslint-disable-next-line no-console
  console.error("[test.setup.e2e] prisma schema sync failed (continuing):", e2);
}

let prisma: PrismaClient | undefined;

beforeAll(async () => {
  // 3) Import prisma AFTER DATABASE_URL is set so the client binds to the E2E DB
  const db = await import("@pathway/db");
  const { prisma: client } = db as { prisma: PrismaClient };
  prisma = client;

  // 4) Minimal deterministic seed for all e2e specs (clean DB per run)
  const SLUG_A = "e2e-tenant-a";
  const SLUG_B = "e2e-tenant-b";

  // Create (or keep) two tenants with the IDs we already placed in env at module load
  await prisma.tenant.upsert({
    where: { slug: SLUG_A },
    update: {},
    create: { id: TENANT_A_ID, slug: SLUG_A, name: "E2E Tenant A" },
  });

  await prisma.tenant.upsert({
    where: { slug: SLUG_B },
    update: {},
    create: { id: TENANT_B_ID, slug: SLUG_B, name: "E2E Tenant B" },
  });

  // Re-export the same IDs to env (for clarity; values are unchanged)
  process.env.E2E_TENANT_ID = TENANT_A_ID;
  process.env.E2E_TENANT2_ID = TENANT_B_ID;
});

afterAll(async () => {
  await prisma?.$disconnect();
});
