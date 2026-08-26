/**
 * TDD Gate 1 — Sprint 26 commit 2 (TD-402)
 * 驗證 Sanitizer SAFE_PATTERNS 漏問題
 *
 * 對應 PRD：docs/prd/03-auth.md (Sprint 20 P2 揭露)
 * 對應 Backlog: TD-402
 *
 * 問題:
 * - 'Cannot register for cancelled/past event' 在 production 被過濾為通用 '提交失敗'
 * - 'StateMachine "x" 拒絕 event "y"' 也被過濾
 * - 'Extension "x" is disabled' 也被過濾
 *
 * 涵蓋:
 * 1. 'Cannot register' 應被保留(production 業務訊息)
 * 2. 'StateMachine ... 拒絕 event' 應被保留
 * 3. 'Extension ... is disabled' 應被保留
 * 4. 中文業務訊息「無法」「不能」應被保留
 * 5. Prisma 內部訊息仍應被過濾
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sanitizeErrorMessage } from '@/lib/runtime/error-sanitizer';

describe('TD-402 — Sanitizer SAFE_PATTERNS 漏 (production 業務訊息應保留)', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // 既有行為（保留）
  it('Zod 業務訊息 (Required) 保留', () => {
    expect(sanitizeErrorMessage(new Error('Required field'))).toBe('Required field');
  });

  it('中文「必填」保留', () => {
    expect(sanitizeErrorMessage(new Error('Email 必填'))).toBe('Email 必填');
  });

  // TD-402 新增
  it('Cannot register 訊息應保留 (event registration 業務訊息)', () => {
    const msg = 'Cannot register for cancelled event';
    expect(sanitizeErrorMessage(new Error(msg))).toBe(msg);
  });

  it('Cannot register for past event 訊息應保留', () => {
    const msg = 'Cannot register for past event (registration closed)';
    expect(sanitizeErrorMessage(new Error(msg))).toBe(msg);
  });

  it('StateMachine 拒絕 event 訊息應保留', () => {
    const msg = 'StateMachine "order" 拒絕 event "cancel"';
    expect(sanitizeErrorMessage(new Error(msg))).toBe(msg);
  });

  it('Extension disabled 訊息應保留', () => {
    const msg = 'Extension "blog" is disabled';
    expect(sanitizeErrorMessage(new Error(msg))).toBe(msg);
  });

  it('中文「無法」「不能」訊息應保留', () => {
    expect(sanitizeErrorMessage(new Error('無法刪除已發布的部落格'))).toBe(
      '無法刪除已發布的部落格',
    );
    expect(sanitizeErrorMessage(new Error('不能修改已完成的訂單'))).toBe(
      '不能修改已完成的訂單',
    );
  });

  // 既有過濾行為（仍正確）
  it('Prisma 內部錯誤仍應被過濾為通用訊息', () => {
    expect(
      sanitizeErrorMessage(
        new Error('Prisma Client known: Invalid `prisma.user.findUnique()` invocation'),
      ),
    ).toBe('提交失敗，請檢查輸入');
  });

  it('完全不認得的訊息 → 通用「提交失敗」', () => {
    expect(
      sanitizeErrorMessage(new Error('Some random internal stack trace message')),
    ).toBe('提交失敗，請檢查輸入');
  });
});

describe('Sanitizer — dev mode (保留原始訊息)', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('dev: Prisma 訊息保留 (方便除錯)', () => {
    expect(
      sanitizeErrorMessage(
        new Error('Prisma Client known: connection timeout'),
      ),
    ).toBe('Prisma Client known: connection timeout');
  });
});