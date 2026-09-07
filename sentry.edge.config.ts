/**
 * ==============================================
 *  Sentry Edge Config (Sprint 57 P0-3)
 * ==============================================
 *
 * Edge runtime（middleware）專用
 * DSN 缺失時 silent no-op
 *
 * 對應 docs/sprint57-plan-gate.md §2
 */

import * as Sentry from '@sentry/nextjs';

const dsn = process.env.SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV ?? 'development',
    release: process.env.SENTRY_RELEASE ?? undefined,
  });
}
