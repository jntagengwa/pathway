import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(__dirname, "../../.env.test"), override: true });
config({ path: path.resolve(__dirname, "../../.env"), override: false });

const BASE_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (BASE_DATABASE_URL) {
  process.env.DATABASE_URL = BASE_DATABASE_URL;
}

// Note: Database migrations should be applied before running tests.
// Use `pnpm db:migrate` or `pnpm db:deploy` to ensure the test database schema is up to date.

