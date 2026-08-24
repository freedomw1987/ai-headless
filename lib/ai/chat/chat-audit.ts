/**
 * Chat Audit Log — TD-502 + TD-505
 *
 * In-memory audit log for /api/chat/stream（單實例）。
 * 生產環境應升級為 DB（Prisma AuditLog）或集中式 log。
 *
 * 用法：
 *   logChatEvent({ userId, action, metadata })
 *   - userId: string
 *   - action: 'chat.start' | 'chat.success' | 'chat.error'
 *           | 'chat.rate_limited' | 'chat.unauthorized' | 'chat.usage'
 *   - metadata?: 額外資料（錯誤訊息、status code、usage 等）
 */

export type ChatAuditAction =
  | 'chat.start'
  | 'chat.success'
  | 'chat.error'
  | 'chat.rate_limited'
  | 'chat.unauthorized'
  | 'chat.usage';

export type ChatAuditEvent = {
  userId: string;
  action: ChatAuditAction;
  timestamp: number;
  metadata?: Record<string, unknown>;
};

const events: ChatAuditEvent[] = [];

export function logChatEvent(
  event: Omit<ChatAuditEvent, 'timestamp'>,
): number {
  const fullEvent: ChatAuditEvent = {
    ...event,
    timestamp: Date.now(),
  };
  events.push(fullEvent);
  console.info('[chat-audit]', fullEvent);
  return events.length;
}

export function getAuditLog(): ReadonlyArray<ChatAuditEvent> {
  return events;
}

export function resetAuditLog(): void {
  events.length = 0;
}
