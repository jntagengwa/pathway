/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  // Allow Caddy proxy hostname so static chunks and assets load when accessing via https://app.localhost:3000
  allowedDevOrigins: ['app.localhost', 'app.localhost:3000'],
};

export default nextConfig;

