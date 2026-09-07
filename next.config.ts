import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs/config';

const baseConfig: NextConfig = {
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

// Sprint 57 P0-3: Sentry config wrapper
// 開發環境（無 SENTRY_AUTH_TOKEN）會自動跳過 source map upload
const sentryConfig = withSentryConfig(baseConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT ?? 'ai-headless',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // 不在 build 時 strip console（debug 友善）
  // source map 路徑
  widenClientFileUpload: true,
});

export default sentryConfig;
