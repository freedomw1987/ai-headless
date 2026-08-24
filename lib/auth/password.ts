/**
 * ==============================================
 *  US-102 — Password Hashing Utilities
 * ==============================================
 *
 * 使用 bcryptjs（純 JS 實作，避免 node-gyp 編譯問題）
 * - hashPassword: 雜湊密碼
 * - verifyPassword: 驗證密碼
 *
 * 為什麼不直接用 bcrypt：bcryptjs 跨平台、純 JS、無 native binding，
 * 在 Serverless / Vercel Edge / 容器環境都能直接跑。
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10; // PRD 3.1 要求 cost factor ≥ 10

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}