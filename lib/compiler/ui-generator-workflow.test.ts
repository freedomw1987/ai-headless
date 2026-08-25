/**
 * Sprint 12 TECH-024 — ui-generator Workflow Transition Buttons
 *
 * 對應：lib/compiler/ui-generator.ts → generateEditPage 加 transition buttons
 *
 * 守護：
 * 1. model 有 workflow 且有 transitions → edit page 含 TransitionButtons 區塊
 * 2. workflow schema inline 寫進產出程式碼（self-contained）
 * 3. 集中元件 TransitionButtons 處理 state machine + fetch
 * 4. model 沒 workflow → edit page 不含 transition buttons
 * 5. workflow 沒 transitions → 不生成 transition buttons
 * 6. 產出程式碼可被 React 渲染（基本結構檢查）
 */

import { describe, it, expect } from 'vitest';
import { generateEditPage } from '@/lib/compiler/ui-generator';
import type { JsonSpec, Model, Workflow } from '@/lib/specs/json-spec.types';

function makeSpec(model: Model, workflow?: Workflow): JsonSpec {
  return {
    name: 'blog',
    label: 'Blog',
    models: [model],
    ...(workflow ? { workflows: [workflow] } : {}),
  };
}

const blogPostModel: Model = {
  name: 'BlogPost',
  label: '文章',
  fields: [
    { name: 'title', type: 'string', label: '標題', validation: { required: true } },
    { name: 'status', type: 'enum', label: '狀態' },
  ],
};

const blogWorkflow: Workflow = {
  name: 'blogPost',
  initialState: 'draft',
  states: {
    draft: { label: '草稿' },
    pending: { label: '審核中' },
    published: { label: '已發布' },
    archived: { label: '已封存' },
  },
  transitions: [
    { from: 'draft', to: 'pending' },
    { from: 'pending', to: 'published' },
    { from: 'pending', to: 'draft' },
    { from: 'published', to: 'archived' },
  ],
};

describe('ui-generator generateEditPage — workflow transition buttons', () => {
  it('model 有 workflow + transitions → edit page 含 TransitionButtons', () => {
    const spec = makeSpec(blogPostModel, blogWorkflow);
    const page = generateEditPage(spec, blogPostModel);

    expect(page.code).toContain('TransitionButtons');
    expect(page.code).toContain('endpoint=');
    expect(page.code).toContain('schema=');
  });

  it('workflow schema inline 寫進產出程式碼', () => {
    const spec = makeSpec(blogPostModel, blogWorkflow);
    const page = generateEditPage(spec, blogPostModel);

    // 應內嵌 state machine schema（id + initial + states）
    expect(page.code).toContain('"initial"');
    expect(page.code).toContain('"id"');
    expect(page.code).toContain('"states"');
    expect(page.code).toContain('"draft"');
    expect(page.code).toContain('"pending"');
  });

  it('endpoint 含 model kebab name', () => {
    const spec = makeSpec(blogPostModel, blogWorkflow);
    const page = generateEditPage(spec, blogPostModel);

    expect(page.code).toContain('/api/crud/blog-post/');
    expect(page.code).toContain('/transition');
  });

  it('沒 workflow → edit page 不含 TransitionButtons', () => {
    const spec = makeSpec(blogPostModel);
    const page = generateEditPage(spec, blogPostModel);

    expect(page.code).not.toContain('TransitionButtons');
  });

  it('workflow 沒 transitions → 不生成 transition buttons', () => {
    const simpleWorkflow: Workflow = {
      name: 'simple',
      initialState: 'start',
      states: { start: { label: '開始' } },
      transitions: [],
    };
    const spec = makeSpec(blogPostModel, simpleWorkflow);
    const page = generateEditPage(spec, blogPostModel);

    expect(page.code).not.toContain('TransitionButtons');
  });

  it('workflow 含 transitions 標籤（state 間轉換）', () => {
    const spec = makeSpec(blogPostModel, blogWorkflow);
    const page = generateEditPage(spec, blogPostModel);

    // transitions 應序列化進 schema：draft 應有 on: { pending: 'pending' }
    expect(page.code).toContain("draft");
    expect(page.code).toContain("pending");
    expect(page.code).toContain("published");
    // on map 應存在
    expect(page.code).toMatch(/"on"\s*:/);
  });

  it('產出程式碼基本結構檢查', () => {
    const spec = makeSpec(blogPostModel, blogWorkflow);
    const page = generateEditPage(spec, blogPostModel);

    // 不應有 unclosed template literals
    const backticks = (page.code.match(/`/g) ?? []).length;
    expect(backticks % 2).toBe(0);

    // 應有 default export
    expect(page.code).toContain('export default function');
    // 應是 React component（return JSX）
    expect(page.code).toMatch(/return \(/);
  });

  it('transition buttons 放在 form 後（不是 form 內）', () => {
    const spec = makeSpec(blogPostModel, blogWorkflow);
    const page = generateEditPage(spec, blogPostModel);

    // </form> 應在 TransitionButtons 之前
    const formEnd = page.code.indexOf('</form>');
    const transitionStart = page.code.indexOf('TransitionButtons');
    expect(formEnd).toBeGreaterThan(-1);
    expect(transitionStart).toBeGreaterThan(formEnd);
  });
});