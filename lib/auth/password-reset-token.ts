/**
 * ==============================================
 *  Password Reset Token (Sprint 56 P0-2)
 * ==============================================
 *
 * 對應 docs/sprint56-plan-gate.md §2.3
 *
 * Schema：使用既有的 NextAuth VerificationToken model
 * identifier = "reset:<userId>" 區分用途
 * 存 hash（SHA-256）避免 DB 洩漏時被拿來重設密碼
 */

import { createHash, randomBytes } from 'crypto';
import { db } from '@/lib/db';

// 1 小時
const PASSWORD_RESET_EXPIRES_MS = 60 * 60 * 1000;

const PREFIX = 'reset:';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * 為用戶產生 password reset token
 *
 * 回傳明文 token（給 email 連結用），存 hash 到 DB
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  // 1. 清除該用戶既有 reset token
  await db.verificationToken.deleteMany({
    where: { identifier: { startsWith: PREFIX + userId } },
  });

  // 2. 產生明文 token
  const plainToken = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(plainToken);

  // 3. 寫入 DB（hash 版本）
  await db.verificationToken.create({
    data: {
      identifier: PREFIX + userId,
      token: tokenHash,
      expires: new Date(Date.now() + PASSWORD_RESET_EXPIRES_MS),
    },
  });

  return plainToken;
}

/**
 * 驗證 token 並返回 userId
 *
 * - token 不存在或過期 → null
 * - token 有效 → userId + 刪除 token（一次性）
 */
export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const tokenHash = hashToken(token);

  const record = await db.verificationToken.findUnique({
    where: { token: tokenHash },
  });

  if (!record) return null;
  if (!record.identifier.startsWith(PREFIX)) return null;
  if (record.expires < new Date()) {
    await db.verificationToken.delete({ where: { token: tokenHash } });
    return null;
  }

  const userId = record.identifier.slice(PREFIX.length);

  // 一次性使用：刪除 token
  await db.verificationToken.delete({ where: { token: tokenHash } });

  return userId;
}

/**
 * 檢查 token 是否還有效（不消耗）
 */
export async function isPasswordResetTokenValid(token: string): Promise<boolean> {
  const tokenHash = hashToken(token);
  const record = await db.verificationToken.findUnique({
    where: { token: tokenHash },
  });
  if (!record) return false;
  if (!record.identifier.startsWith(PREFIX)) return false;
  if (record.expires < new Date()) return false;
  return true;
}
