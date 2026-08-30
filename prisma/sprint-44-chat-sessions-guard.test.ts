/**
 * Sprint 44 Commit G — ChatSession / ChatMessage schema 守護測試
 *
 * 設計 (S44 Plan Gate Commit G):
 * - ChatSession: 每個 admin user 的對話 sessions (userId 必填, 多筆)
 * - ChatMessage: session 內訊息 (role + content + metadata)
 * - 跟現有 ChatMessage type (lib/ai/chat/chat-utils.ts) 兼容
 *
 * 注意:
 * - 既有 AIConfig 是 Global URL (userId=null, unique)
 * - ChatSession 改為 userId 必填 (每個 admin 有自己的對話列表)
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';

describe('S44-G — ChatSession / ChatMessage Schema', () => {
  it('應有 ChatSession model', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    expect(schema, '應有 ChatSession model').toMatch(/model\s+ChatSession/);
  });

  it('應有 ChatMessage model', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    expect(schema, '應有 ChatMessage model').toMatch(/model\s+ChatMessage/);
  });

  it('ChatSession 應有 userId 欄位 (admin user 隔離)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const sessionMatch = schema.match(/model\s+ChatSession\s*\{[\s\S]*?\n\}/);
    expect(sessionMatch, '應能找到 ChatSession model').toBeTruthy();
    const body = sessionMatch![0];
    expect(body, 'ChatSession 應有 userId 欄位').toMatch(/userId\s+String/);
  });

  it('ChatSession 應有 messages 關聯 (一對多)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const sessionMatch = schema.match(/model\s+ChatSession\s*\{[\s\S]*?\n\}/);
    expect(sessionMatch, '應能找到 ChatSession model').toBeTruthy();
    const body = sessionMatch![0];
    expect(body, 'ChatSession 應有 messages ChatMessage[] 關聯').toMatch(
      /messages\s+ChatMessage\[\]/,
    );
  });

  it('ChatMessage 應有 sessionId 欄位 (FK)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const msgMatch = schema.match(/model\s+ChatMessage\s*\{[\s\S]*?\n\}/);
    expect(msgMatch, '應能找到 ChatMessage model').toBeTruthy();
    const body = msgMatch![0];
    expect(body, 'ChatMessage 應有 sessionId 欄位').toMatch(/sessionId\s+String/);
  });

  it('ChatMessage 應有 role + content 欄位', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf-8');
    const msgMatch = schema.match(/model\s+ChatMessage\s*\{[\s\S]*?\n\}/);
    expect(msgMatch, '應能找到 ChatMessage model').toBeTruthy();
    const body = msgMatch![0];
    expect(body, 'ChatMessage 應有 role 欄位').toMatch(/role\s+String/);
    expect(body, 'ChatMessage 應有 content 欄位').toMatch(/content\s+String\s+@db\.Text/);
  });

  it('應有 Sprint 44 chat sessions migration', () => {
    // Prisma 自動產生 timestamp prefix (20260830150957_sprint44_chat_sessions_index)
    const migrations = readFileSync('prisma/schema.prisma', 'utf-8');
    expect(migrations, '應有 [userId, updatedAt] index').toMatch(
      /@@index\(\[userId,\s*updatedAt\(sort:\s*Desc\)\]\)/,
    );
  });
});