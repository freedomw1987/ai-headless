import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // 允許跨 Extension 目錄（workspace pattern）
    externalDir: true,
  },

  // 支援 @/extensions/* 路徑別名
  transpilePackages: [],

  // 圖片優化
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  // TypeScript 嚴格模式
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint 嚴格模式
  eslint: {
    ignoreDuringBuilds: false,
  },

  // 為 AI Pipeline 提供服務端 API
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
};

export default nextConfig;
