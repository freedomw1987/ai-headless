/**
 * Blog Action: publishBlogPost
 *
 * 動作：將 BlogPost 從 draft/pending → published
 * 同時設定 publishedAt = now()
 */

import type { ActionContext } from '@/lib/actions/action-sdk';

export async function publishBlogPost(
  ctx: ActionContext,
): Promise<Record<string, unknown>> {
  const data = ctx.data as { status?: string; publishedAt?: Date | string };

  return {
    ...ctx.data,
    status: 'published',
    publishedAt: new Date().toISOString(),
  };
}