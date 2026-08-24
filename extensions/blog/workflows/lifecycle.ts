/**
 * Blog Workflow: lifecycle
 *
 * BlogPost 狀態機：
 *
 *   draft ──submit──▶ pending ──approve──▶ published ──archive──▶ archived
 *     │                  │                     │
 *     └─────reject───────┘                     │
 *     │                                        │
 *     └────────────────────────────────────────┴──unpublish──▶ draft
 *
 * Transitions 通過 Transition 物件的 from/to 表達。
 * 每個 transition 對應一種「trigger 名稱」（在 metadata 中）。
 */

import { createStateMachine } from '@/lib/workflows/workflow-engine';

export const blogLifecycle = createStateMachine({
  name: 'blog.lifecycle',
  initialState: 'draft',
  states: {
    draft: { label: '草稿' },
    pending: { label: '待審核' },
    published: { label: '已發布' },
    archived: { label: '已封存' },
  },
  transitions: [
    {
      from: 'draft',
      to: 'pending',
      // trigger name: submit
    },
    {
      from: 'pending',
      to: 'draft',
      // trigger name: reject
    },
    {
      from: 'pending',
      to: 'published',
      // trigger name: approve
    },
    {
      from: 'published',
      to: 'archived',
      // trigger name: archive
    },
    {
      from: 'published',
      to: 'draft',
      // trigger name: unpublish
    },
  ],
});

/** Trigger 名稱常數（給 UI / API 呼叫使用） */
export const BLOG_TRIGGERS = {
  SUBMIT: 'submit',
  REJECT: 'reject',
  APPROVE: 'approve',
  ARCHIVE: 'archive',
  UNPUBLISH: 'unpublish',
} as const;