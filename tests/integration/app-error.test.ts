/**
 * TDD Gate 1 — Sprint 27 commit 2 (TD-524)
 * 驗證 AppError class + ErrorCategory enum
 *
 * 對應 PRD: docs/specs/json-spec.md
 * 對應 Backlog: TD-524 (Sprint 26 reflection 揭露)
 *
 * 問題:
 * - Sanitizer 用 regex 陣列判斷錯誤訊息類型
 * - 新錯誤訊息需手動加 regex,易遺漏
 * - 訊息變更時 regex 失效 (silent regression)
 * - 無法在 IDE 看到所有「安全訊息」列舉
 *
 * 修正:
 * - AppError class 帶 category field
 * - ErrorCategory enum: VALIDATION / BUSINESS_RULE / EXTENSION / INTERNAL
 * - Sanitizer 改用 instanceof AppError + category
 * - 保留 regex fallback (向後相容舊 throw new Error)
 *
 * 涵蓋:
 * 1. AppError instance 檢查
 * 2. AppError category 對應 sanitize 行為
 * 3. Sanitizer 對 AppError 優先用 category (而非 regex)
 * 4. 舊 throw new Error(...) 仍走 regex fallback
 * 5. INVALID 類別在 production 仍被過濾
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  AppError,
  ErrorCategory,
  classifyError,
  sanitizeErrorMessageV2,
} from '@/lib/runtime/app-error';

describe('TD-524 — AppError class + ErrorCategory enum', () => {
  describe('AppError class', () => {
    it('應是 Error 實例', () => {
      const err = new AppError('Cannot register', ErrorCategory.BUSINESS_RULE);
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(AppError);
    });

    it('應有 message + category 屬性', () => {
      const err = new AppError('Cannot register for cancelled event', ErrorCategory.BUSINESS_RULE);
      expect(err.message).toBe('Cannot register for cancelled event');
      expect(err.category).toBe('BUSINESS_RULE');
    });

    it('應有 name = "AppError"', () => {
      const err = new AppError('test', ErrorCategory.VALIDATION);
      expect(err.name).toBe('AppError');
    });

    it('category 應為 ErrorCategory enum 值', () => {
      const err1 = new AppError('a', ErrorCategory.VALIDATION);
      const err2 = new AppError('b', ErrorCategory.BUSINESS_RULE);
      const err3 = new AppError('c', ErrorCategory.EXTENSION);
      const err4 = new AppError('d', ErrorCategory.INTERNAL);
      expect(err1.category).toBe('VALIDATION');
      expect(err2.category).toBe('BUSINESS_RULE');
      expect(err3.category).toBe('EXTENSION');
      expect(err4.category).toBe('INTERNAL');
    });
  });

  describe('classifyError (sanitizer 內部 helper)', () => {
    it('AppError → 回傳其 category', () => {
      const err = new AppError('test', ErrorCategory.BUSINESS_RULE);
      expect(classifyError(err)).toBe('BUSINESS_RULE');
    });

    it('普通 Error → 回傳 UNKNOWN (走 regex fallback)', () => {
      expect(classifyError(new Error('random'))).toBe('UNKNOWN');
    });

    it('非 Error 物件 → 回傳 UNKNOWN', () => {
      expect(classifyError('string error')).toBe('UNKNOWN');
      expect(classifyError(null)).toBe('UNKNOWN');
      expect(classifyError(undefined)).toBe('UNKNOWN');
    });
  });

  describe('sanitizeErrorMessageV2 (production 行為)', () => {
    beforeEach(() => {
      vi.stubEnv('NODE_ENV', 'production');
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('AppError BUSINESS_RULE → 直接回傳訊息 (可安全暴露)', () => {
      const err = new AppError('Cannot register for cancelled event', ErrorCategory.BUSINESS_RULE);
      expect(sanitizeErrorMessageV2(err)).toBe('Cannot register for cancelled event');
    });

    it('AppError VALIDATION → 直接回傳訊息', () => {
      const err = new AppError('Email 必填', ErrorCategory.VALIDATION);
      expect(sanitizeErrorMessageV2(err)).toBe('Email 必填');
    });

    it('AppError EXTENSION → 直接回傳訊息', () => {
      const err = new AppError('Extension "blog" is disabled', ErrorCategory.EXTENSION);
      expect(sanitizeErrorMessageV2(err)).toBe('Extension "blog" is disabled');
    });

    it('AppError INTERNAL → 過濾為通用「提交失敗」', () => {
      const err = new AppError('Prisma connection failed', ErrorCategory.INTERNAL);
      expect(sanitizeErrorMessageV2(err)).toBe('提交失敗，請檢查輸入');
    });

    it('普通 Error + regex 匹配 (Cannot register) → 仍可暴露 (向後相容)', () => {
      const err = new Error('Cannot register for past event');
      expect(sanitizeErrorMessageV2(err)).toBe('Cannot register for past event');
    });

    it('普通 Error + regex 不匹配 → 過濾為通用訊息', () => {
      const err = new Error('Prisma Client known: timeout');
      expect(sanitizeErrorMessageV2(err)).toBe('提交失敗，請檢查輸入');
    });
  });
});

describe('TD-524 — Sanitizer 與舊版相容 (向後相容)', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('dev mode: 保留原始訊息 (與舊 sanitizeErrorMessage 一致)', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    const { sanitizeErrorMessage } = await import('@/lib/runtime/error-sanitizer');
    expect(
      sanitizeErrorMessage(new Error('Prisma Client known: connection timeout')),
    ).toBe('Prisma Client known: connection timeout');
  });
});