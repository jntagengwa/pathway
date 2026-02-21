import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Always build standalone for production deploys; Next ignores it in dev.
  output: 'standalone',

  // Monorepo support: ensures Next traces server files from the repo root.
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },

  // Allow Caddy proxy hostname so static chunks and assets load when accessing via https://app.localhost:3000
  allowedDevOrigins: ['app.localhost', 'app.localhost:3000'],
};

export default nextConfig;
