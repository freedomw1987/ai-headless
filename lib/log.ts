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

/**
 * 偵測是否跑在 Node.js runtime
 *
 * Edge runtime (Next.js middleware 強制) 不支援 process.stdout.write
 * 但 process.versions.node 在 Edge runtime 是 undefined，可作為可靠偵測
 *
 * Sprint 57 R6 揭露: middleware.ts → request-context.ts → log.ts
 * middleware 在 Edge runtime 跑，會 import log.ts 整個 module
 * 必須區分 runtime 才不會在 Edge 環境 build/runtime 炸掉
 */
function isNodeRuntime(): boolean {
  return (
    typeof process !== 'undefined' &&
    typeof process.versions === 'object' &&
    typeof process.versions?.node === 'string'
  );
}

function shouldLog(level: LogLevel): boolean {
  const logLevel = (process.env.LOG_LEVEL as LogLevel) ?? (isProduction() ? 'info' : 'debug');
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[logLevel];
}

// Sprint 57 R6: 可選注入的 request id provider
// 在 server runtime 把 AsyncLocalStorage 讀取邏輯掛上即可，不裝也可以正常運作
let requestIdProvider: (() => string | undefined) | null = null;

export function setLogRequestIdProvider(provider: () => string | undefined) {
  requestIdProvider = provider;
}

function getCurrentRequestId(): string | undefined {
  if (!requestIdProvider) return undefined;
  try {
    return requestIdProvider();
  } catch {
    return undefined;
  }
}

function emit(level: LogLevel, msg: string, context?: LogContext): void {
  if (!shouldLog(level)) return;

  const requestId = getCurrentRequestId();

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    msg,
    ...(requestId ? { requestId } : {}),
    ...context,
  };

  // Production: 輸出 JSON-line
  //   - Node runtime: 用 process.stdout/stderr (12-factor compatible)
  //   - Edge runtime: fallback 到 console (Vercel/Docker 都會收集)
  // Development: 輸出 human-readable 到 console
  if (isProduction()) {
    if (isNodeRuntime()) {
      const stream = level === 'error' ? process.stderr : process.stdout;
      stream.write(JSON.stringify(entry) + '\n');
    } else {
      // Edge runtime fallback
      const fn = level === 'error' ? console.error : console.log;
      fn(JSON.stringify(entry));
    }
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