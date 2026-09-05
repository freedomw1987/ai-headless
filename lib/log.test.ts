/**
 * Sprint 55 — Structured Logger 單元測試
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger, createChildLogger } from './log';

describe('lib/log', () => {
  // vitest type issue: vi.spyOn returns overloaded MockInstance
  // 避開複雜型別推斷, 用 any
  let stdoutSpy: any;
  let stderrSpy: any;
  let originalNodeEnv: string | undefined;
  let originalLogLevel: string | undefined;

  const envMut = process.env as unknown as Record<string, string | undefined>;

  beforeEach(() => {
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation((() => true) as never);
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation((() => true) as never);
    originalNodeEnv = envMut.NODE_ENV;
    originalLogLevel = envMut.LOG_LEVEL;
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    if (originalNodeEnv === undefined) {
      delete envMut.NODE_ENV;
    } else {
      envMut.NODE_ENV = originalNodeEnv;
    }
    if (originalLogLevel === undefined) {
      delete envMut.LOG_LEVEL;
    } else {
      envMut.LOG_LEVEL = originalLogLevel;
    }
  });

  describe('logger', () => {
    it('debug/info/warn 應輸出到 stdout', () => {
      envMut.NODE_ENV = 'production';
      logger.info('test message');
      expect(stdoutSpy).toHaveBeenCalled();
      expect(stderrSpy).not.toHaveBeenCalled();
    });

    it('error 應輸出到 stderr', () => {
      envMut.NODE_ENV = 'production';
      logger.error('test error');
      expect(stderrSpy).toHaveBeenCalled();
      expect(stdoutSpy).not.toHaveBeenCalled();
    });

    it('production 應輸出 JSON line 格式', () => {
      envMut.NODE_ENV = 'production';
      logger.info('hello', { userId: 'u1' });

      const call = stdoutSpy.mock.calls[0]?.[0] as string;
      expect(call).toMatch(/^\{.*\}\n$/);

      const parsed = JSON.parse(call.trim());
      expect(parsed.timestamp).toBeDefined();
      expect(parsed.level).toBe('info');
      expect(parsed.msg).toBe('hello');
      expect(parsed.userId).toBe('u1');
    });

    it('應包含 timestamp ISO 格式', () => {
      envMut.NODE_ENV = 'production';
      logger.info('t');
      const call = stdoutSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(call.trim());
      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('應支援 debug/info/warn/error 四個 level', () => {
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    it('LOG_LEVEL 控制輸出 (info 模式不輸出 debug)', () => {
      envMut.NODE_ENV = 'production';
      envMut.LOG_LEVEL = 'info';
      logger.debug('should not log');
      expect(stdoutSpy).not.toHaveBeenCalled();

      logger.info('should log');
      expect(stdoutSpy).toHaveBeenCalledTimes(1);
    });

    it('LOG_LEVEL=error 只輸出 error', () => {
      envMut.NODE_ENV = 'production';
      envMut.LOG_LEVEL = 'error';
      logger.debug('d');
      logger.info('i');
      logger.warn('w');
      expect(stdoutSpy).not.toHaveBeenCalled();

      logger.error('e');
      expect(stderrSpy).toHaveBeenCalledTimes(1);
    });

    it('無 context 應可正常運作', () => {
      envMut.NODE_ENV = 'production';
      logger.info('no context');
      const call = stdoutSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(call.trim());
      expect(parsed.msg).toBe('no context');
    });

    it('多個 context 應合併', () => {
      envMut.NODE_ENV = 'production';
      logger.info('multi', { a: 1, b: 'two', c: true });
      const call = stdoutSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(call.trim());
      expect(parsed.a).toBe(1);
      expect(parsed.b).toBe('two');
      expect(parsed.c).toBe(true);
    });
  });

  describe('createChildLogger', () => {
    it('應預先綁定 context', () => {
      envMut.NODE_ENV = 'production';
      const log = createChildLogger({ userId: 'u1', sessionId: 's1' });
      log.info('msg');

      const call = stdoutSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(call.trim());
      expect(parsed.userId).toBe('u1');
      expect(parsed.sessionId).toBe('s1');
    });

    it('call-site context 應覆蓋 bound context', () => {
      envMut.NODE_ENV = 'production';
      const log = createChildLogger({ userId: 'u1' });
      log.info('msg', { userId: 'u2', extra: 'e' });

      const call = stdoutSpy.mock.calls[0]?.[0] as string;
      const parsed = JSON.parse(call.trim());
      expect(parsed.userId).toBe('u2');
      expect(parsed.extra).toBe('e');
    });

    it('child logger 應有所有 4 個 level 方法', () => {
      const log = createChildLogger({});
      expect(typeof log.debug).toBe('function');
      expect(typeof log.info).toBe('function');
      expect(typeof log.warn).toBe('function');
      expect(typeof log.error).toBe('function');
    });
  });
});