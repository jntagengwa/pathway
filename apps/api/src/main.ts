import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import fs from "node:fs";
import type { HttpsOptions } from "@nestjs/common/interfaces/external/https-options.interface";

function readHttpsOptionsFromEnv(): HttpsOptions | undefined {
  const keyPath = process.env.API_DEV_SSL_KEY ?? process.env.NEXT_DEV_SSL_KEY;
  const certPath =
    process.env.API_DEV_SSL_CERT ?? process.env.NEXT_DEV_SSL_CERT;

  if (!keyPath || !certPath) return undefined;

  if (!fs.existsSync(keyPath)) {
    throw new Error(`HTTPS key file not found at: ${keyPath}`);
  }
  if (!fs.existsSync(certPath)) {
    throw new Error(`HTTPS cert file not found at: ${certPath}`);
  }

  return {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
  };
}

async function bootstrap() {
  const httpsOptions = readHttpsOptionsFromEnv();

  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: true,
      credentials: true,
    },
    ...(httpsOptions ? { httpsOptions } : {}),
    rawBody: true, // Enable raw body for all routes
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.API_PORT ? Number(process.env.API_PORT) : 3001;
  await app.listen(port);

  const host = process.env.API_HOST ?? "api.localhost";
  const scheme = httpsOptions ? "https" : "http";

  console.log(`🚀 API listening on ${scheme}://${host}:${port}`);
}

void bootstrap().catch((err: unknown) => {
  // Fail fast in dev if HTTPS files are missing/misconfigured.
  console.error("Failed to start API", err);
  process.exit(1);
});
