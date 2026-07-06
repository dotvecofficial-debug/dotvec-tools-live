import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  serverExternalPackages: ['sanitize-html'],
  experimental: {
    cpus: 2,
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
