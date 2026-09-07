/**
 * ==============================================
 *  Email Verification Token (Sprint 56 P0-1)
 * ==============================================
 *
 * 對應 docs/sprint56-plan-gate.md §2.2
 *
 * Schema：使用既有的 NextAuth VerificationToken model
 * 重新定義 shape 以適合 email verification 用途
 *
 * Note：NextAuth 的 VerificationToken 有 (identifier, token, expires)
 *       我們把 userId 放 identifier，token 隨機產生，expires 24h
 */

import { randomBytes } from 'crypto';
import { db } from '@/lib/db';

// 24 小時
const VERIFICATION_EXPIRES_MS = 24 * 60 * 60 * 1000;

/**
 * 為用戶產生 verification token
 *
 * 流程：
 * 1. 刪除該用戶既有 token（避免多個有效 token）
 * 2. 產生隨機 token（base64url）
 * 3. 寫入 DB（24 小時過期）
 */
export async function createVerificationToken(userId: string): Promise<string> {
  // 1. 清除既有 token
  await db.verificationToken.deleteMany({
    where: { identifier: userId },
  });

  // 2. 產生 token
  const token = randomBytes(32).toString('base64url');

  // 3. 寫入 DB
  await db.verificationToken.create({
    data: {
      identifier: userId,
      token,
      expires: new Date(Date.now() + VERIFICATION_EXPIRES_MS),
    },
  });

  return token;
}

/**
 * 驗證 token 並返回 userId
 *
 * 副作用：
 * - token 有效 → 標記 User.emailVerified + 刪除 token（一次性）
 * - token 過期或不存在 → 回傳 null
 */
export async function consumeVerificationToken(token: string): Promise<string | null> {
  const record = await db.verificationToken.findUnique({
    where: { token },
  });

  if (!record) return null;
  if (record.expires < new Date()) {
    // 過期 token：清理後返回 null
    await db.verificationToken.delete({ where: { token } });
    return null;
  }

  // 標記 email 已驗證
  await db.user.update({
    where: { id: record.identifier },
    data: { emailVerified: new Date() },
  });

  // 一次性使用：刪除 token
  await db.verificationToken.delete({ where: { token } });

  return record.identifier;
}

/**
 * 檢查 token 是否還有效（不消耗）
 */
export async function isVerificationTokenValid(token: string): Promise<boolean> {
  const record = await db.verificationToken.findUnique({
    where: { token },
  });
  if (!record) return false;
  if (record.expires < new Date()) return false;
  return true;
}
