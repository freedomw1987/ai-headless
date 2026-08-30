/**
 * TD-524 — Sanitizer error taxonomy 守護測試
 *
 * 為什麼需要：
 * - 舊 Sanitizer 用 regex 陣列判斷錯誤類型 → 新錯誤訊息需手動加 regex
 * - Sprint 27 已加 AppError + ErrorCategory + sanitizeErrorMessageV2
 * - 本測試守護：V2 sanitizer 必須存在 + 分類正確
 *
 * Gate 1 TDD：直接測試 sanitizeErrorMessageV2 行為
 */

import { describe, it, expect, vi } from 'vitest';
import { AppError, ErrorCategory, sanitizeErrorMessageV2 } from '@/lib/runtime/app-error';

describe('TD-524 — Sanitizer error taxonomy (AppError + ErrorCategory)', () => {
  describe('ErrorCategory 存在 4 種類別', () => {
    it('VALIDATION (可安全暴露給 client)', () => {
      expect(ErrorCategory.VALIDATION).toBe('VALIDATION');
    });
    it('BUSINESS_RULE (可安全暴露)', () => {
      expect(ErrorCategory.BUSINESS_RULE).toBe('BUSINESS_RULE');
    });
    it('EXTENSION (可安全暴露)', () => {
      expect(ErrorCategory.EXTENSION).toBe('EXTENSION');
    });
    it('INTERNAL (不可暴露，過濾為通用訊息)', () => {
      expect(ErrorCategory.INTERNAL).toBe('INTERNAL');
    });
  });

  describe('AppError 帶 category', () => {
    it('VALIDATION 錯誤可安全暴露', () => {
      const err = new AppError('Email 必填', ErrorCategory.VALIDATION);
      expect(err.message).toBe('Email 必填');
      expect(err.category).toBe(ErrorCategory.VALIDATION);
      expect(err).toBeInstanceOf(Error);
    });

    it('INTERNAL 錯誤不可暴露', () => {
      const err = new AppError('DB connection failed: postgres://...', ErrorCategory.INTERNAL);
      expect(err.category).toBe(ErrorCategory.INTERNAL);
    });
  });

  describe('sanitizeErrorMessageV2', () => {
    it('AppError VALIDATION → 原始訊息', () => {
      const err = new AppError('Email 必填', ErrorCategory.VALIDATION);
      expect(sanitizeErrorMessageV2(err)).toBe('Email 必填');
    });

    it('AppError BUSINESS_RULE → 原始訊息', () => {
      const err = new AppError('Cannot register for cancelled event', ErrorCategory.BUSINESS_RULE);
      expect(sanitizeErrorMessageV2(err)).toBe('Cannot register for cancelled event');
    });

    it('AppError EXTENSION → 原始訊息', () => {
      const err = new AppError('Extension disabled', ErrorCategory.EXTENSION);
      expect(sanitizeErrorMessageV2(err)).toBe('Extension disabled');
    });

it('AppError INTERNAL → 過濾為通用訊息（不洩漏內部細節, production 模式）', () => {
      // 用 vi.stubEnv 模擬 production 環境
      vi.stubEnv('NODE_ENV', 'production');
      try {
        const err = new AppError('DB connection failed: postgres://user:pass@host', ErrorCategory.INTERNAL);
        const sanitized = sanitizeErrorMessageV2(err);
        expect(sanitized).not.toContain('postgres://');
        expect(sanitized).not.toContain('user:pass');
      } finally {
        vi.unstubAllEnvs();
      }
    });

    it('一般 Error → 走 regex fallback（不 crash）', () => {
      const err = new Error('Some unknown error');
      // 不 crash，回傳某個訊息（可能是原訊息或通用訊息）
      const sanitized = sanitizeErrorMessageV2(err);
      expect(typeof sanitized).toBe('string');
      expect(sanitized.length).toBeGreaterThan(0);
    });

    it('null/undefined → 通用訊息', () => {
      expect(sanitizeErrorMessageV2(null)).toBeTruthy();
      expect(sanitizeErrorMessageV2(undefined)).toBeTruthy();
    });
  });
});