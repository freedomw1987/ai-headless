/**
 * US-102 — Auth.js v5 Edge-Safe Config
 *
 * 為什麼分兩個檔案：
 * - middleware.ts 跑在 Edge Runtime（Vercel/Cloudflare 用），不能用 Prisma / Node API
 * - auth/config.ts 是完整版（含 PrismaAdapter + Credentials authorize）
 *
 * Edge-safe 版本只放 pages 設定 + 空 providers，
 * middleware 用這個檔案做「session 在不在」檢查。
 */

import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe config（沒有 DB 依賴）
 * 給 middleware.ts 用，僅檢查 session 是否存在
 */
export const authConfig = {
  pages: {
    signIn: '/admin/login',
  },
  providers: [], // middleware 不負責 authorize，交給完整 config
  callbacks: {
    authorized({ auth }) {
      return Boolean(auth);
    },
  },
} satisfies NextAuthConfig;