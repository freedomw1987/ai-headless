/**
 * ==============================================
 *  Sentry Server Config (Sprint 57 P0-3)
 * ==============================================
 *
 * DSN 缺失時 silent no-op（不 throw，避免開發環境沒設就炸）
 *
 * 對應 docs/sprint57-plan-gate.md §2
 */

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1, // 10% traces
    sampleRate: 1.0, // 100% errors
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.SENTRY_RELEASE ?? undefined,

    // PII 過濾：避免敏感資料送到 Sentry
    beforeSend(event) {
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
        delete event.user.username;
      }
      if (event.request && typeof event.request === 'object') {
        const req = event.request as Record<string, unknown>;
        if ('cookies' in req) {
          req.cookies = '[Filtered]';
        }
      }
      return event;
    },

    // 忽略噪音
    ignoreErrors: [
      /^NetworkError/, // 瀏覽器斷線
      /^AbortError/, // fetch abort
    ],
  });
}
