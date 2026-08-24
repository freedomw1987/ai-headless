/**
 * Chat Auth Guard — TD-502
 *
 * /api/chat/stream 的 server-side 驗證。
 * - 未登入 → 拋 ChatAuthError(401)
 * - session 缺 user.id → 拋 ChatAuthError(401)
 */

import { getCurrentUser } from '@/lib/auth/auth';

export class ChatAuthError extends Error {
  readonly statusCode = 401;
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'ChatAuthError';
  }
}

export async function requireChatAuth() {
  const user = await getCurrentUser();

  if (!user || !user.id) {
    throw new ChatAuthError('Not authenticated');
  }

  return user;
}