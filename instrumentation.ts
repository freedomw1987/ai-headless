/**
 * ==============================================
 *  Next.js Instrumentation Hook (Sprint 57 P0-3, Sprint 58 +onRequestError)
 * ==============================================
 *
 * Next.js 15 標準 pattern：在這裡 import Sentry init
 * 對應 docs/sprint57-plan-gate.md §2
 */

import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Sprint 58: Sentry 建議加 onRequestError hook
// 參考：https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
export async function onRequestError(
  err: unknown,
  request: {
    path: string;
    method: string;
    headers: Record<string, string | string[] | undefined>;
  },
  context: {
    routerKind: 'Pages Router' | 'App Router';
    routePath: string;
    routeType: 'render' | 'route' | 'action' | 'middleware';
    revalidateReason?: 'on-demand' | 'stale' | undefined;
    renderSource?:
      | 'react-server-components'
      | 'react-server-components-action'
      | 'server-rendering';
  },
) {
  Sentry.captureRequestError(err, request, context);
}