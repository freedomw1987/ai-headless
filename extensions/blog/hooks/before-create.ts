/**
 * Blog Hook: beforeCreateBlogPost
 *
 * 在建立 BlogPost 之前自動執行：
 * 1. 自動生成 slug（從 title 推導 URL 友善識別）
 * 2. 自動生成 excerpt（取 content 前 200 字）
 * 3. 預設 status = 'draft'
 */

import type { HookContext } from '@/lib/hooks/hook-sdk';

export async function beforeCreateBlogPost(
  ctx: HookContext<'beforeCreate'>,
): Promise<Record<string, unknown>> {
  const data = ctx.data;

  // 1. 自動生成 slug（如果沒提供）
  if (!data.slug && typeof data.title === 'string') {
    data.slug = generateSlug(data.title);
  }

  // 2. 自動生成 excerpt（如果沒提供）
  if (!data.excerpt && typeof data.content === 'string') {
    data.excerpt = generateExcerpt(data.content);
  }

  // 3. 預設 status
  if (!data.status) {
    data.status = 'draft';
  }

  return data;
}

/**
 * 生成 URL 友善 slug
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    // 移除非英文字母數字（保留中英文）
    .replace(/[^\w\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * 取內容前 200 字作為摘要
 */
function generateExcerpt(content: string): string {
  const plain = content.replace(/<[^>]*>/g, '').trim();
  if (plain.length <= 200) return plain;
  return plain.slice(0, 200).trim() + '…';
}