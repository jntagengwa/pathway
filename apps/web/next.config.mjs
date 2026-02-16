/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  async redirects() {
    return [
      { source: '/resources', destination: '/blog', permanent: true },
      { source: '/resources/:slug', destination: '/blog/:slug', permanent: true },
    ];
  },
};

export default nextConfig;

