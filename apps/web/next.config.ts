import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@servicos/types', '@servicos/utils'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
