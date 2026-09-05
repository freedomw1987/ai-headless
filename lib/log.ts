/**
 * Sprint 55 Productization — 結構化 Logger (P1-1)
 *
 * 設計:
 * - 不引入新依賴 (pino / winston 會增加 bundle size)
 * - 用 process.stdout/stderr JSON-line 格式 (12-factor compatible)
 * - 保留 console.error fallback (dev 環境)
 * - 自動加 timestamp + level
 *
 * 取代散落的 console.log/error, 提供結構化日誌
 * Production 部署到 Vercel/Docker 時, JSON line 會被自動收集
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = Record<string, unknown>;

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function shouldLog(level: LogLevel): boolean {
  const logLevel = (process.env.LOG_LEVEL as LogLevel) ?? (isProduction() ? 'info' : 'debug');
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[logLevel];
}

function emit(level: LogLevel, msg: string, context?: LogContext): void {
  if (!shouldLog(level)) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    msg,
    ...context,
  };

  // Production: 輸出 JSON-line 到 stdout/stderr
  // Development: 輸出 human-readable 到 console
  if (isProduction()) {
    const stream = level === 'error' ? process.stderr : process.stdout;
    stream.write(JSON.stringify(entry) + '\n');
  } else {
    const fn = level === 'error' ? console.error : console.log;
    const tag = `[${entry.timestamp}] ${level.toUpperCase()}`;
    if (context && Object.keys(context).length > 0) {
      fn(tag, msg, context);
    } else {
      fn(tag, msg);
    }
  }
}

export const logger = {
  debug: (msg: string, context?: LogContext) => emit('debug', msg, context),
  info: (msg: string, context?: LogContext) => emit('info', msg, context),
  warn: (msg: string, context?: LogContext) => emit('warn', msg, context),
  error: (msg: string, context?: LogContext) => emit('error', msg, context),
};

/**
 * Child logger — 預先綁定 context (例如 userId / sessionId / requestId)
 * 用法:
 *   const log = createChildLogger({ userId, sessionId });
 *   log.info('processing message');
 */
export function createChildLogger(boundContext: LogContext) {
  return {
    debug: (msg: string, context?: LogContext) => emit('debug', msg, { ...boundContext, ...context }),
    info: (msg: string, context?: LogContext) => emit('info', msg, { ...boundContext, ...context }),
    warn: (msg: string, context?: LogContext) => emit('warn', msg, { ...boundContext, ...context }),
    error: (msg: string, context?: LogContext) => emit('error', msg, { ...boundContext, ...context }),
  };
}