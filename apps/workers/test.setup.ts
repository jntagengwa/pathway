import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(__dirname, "../../.env.test"), override: true });
config({ path: path.resolve(__dirname, "../../.env"), override: false });

if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

