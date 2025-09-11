import { config } from "dotenv";
import path from "node:path";

// Load repo root .env for DATABASE_URL, API_PORT, etc.
config({ path: path.resolve(__dirname, "../../../.env") });
