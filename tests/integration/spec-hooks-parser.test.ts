/**
 * TDD Gate 1 — Sprint 26 commit 4 (TD-404)
 * Spec hooks parser 應支援嵌套 JSON
 *
 * 對應 PRD: docs/specs/json-spec.md
 * 對應 Backlog: TD-404 (Sprint 20 P2 揭露)
 *
 * 問題:
 * - 現有 regex: /"hooks"\s*:\s*\{([^{}]*)\}/g
 * - 不支援嵌套 JSON (因為 [^{}]* 不允許 { })
 * - 例: "hooks": { "beforeCreate": { "data": "{{fn:myHook}}" } } 匹配失敗
 *
 * 修正:
 * - 重寫為支援 balanced braces matching
 * - 或改用 JSON.parse 然後 walk spec
 */

import { describe, it, expect } from 'vitest';
import { extractSpecHookReferences } from '@/lib/specs/spec-hooks-parser';

describe('TD-404 — Spec hooks parser 支援嵌套 JSON', () => {
  it('簡單 spec: "hooks": { "beforeCreate": "{{fn:myHook}}" }', () => {
    const content = `
{
  "models": [{
    "name": "todo",
    "hooks": {
      "beforeCreate": "{{fn:myHook}}"
    }
  }]
}
`;
    const refs = extractSpecHookReferences(content);
    expect(refs).toContain('myHook');
  });

  it('嵌套 JSON 應正確解析', () => {
    // TD-404 核心問題: hooks 區塊內含嵌套 { }
    const content = `
{
  "models": [{
    "name": "todo",
    "hooks": {
      "beforeCreate": {
        "data": {
          "title": "{{fn:myHook}}"
        }
      }
    }
  }]
}
`;
    const refs = extractSpecHookReferences(content);
    expect(refs).toContain('myHook');
  });

  it('多個 {{fn:...}} 引用都應被提取', () => {
    const content = `
{
  "models": [{
    "name": "blog",
    "hooks": {
      "beforeCreate": "{{fn:hookA}}",
      "afterCreate": "{{fn:hookB}}"
    }
  }]
}
`;
    const refs = extractSpecHookReferences(content);
    expect(refs).toContain('hookA');
    expect(refs).toContain('hookB');
  });

  it('嵌套 JSON + 多個引用', () => {
    const content = `
{
  "models": [{
    "name": "event",
    "hooks": {
      "beforeCreate": {
        "data": { "ref": "{{fn:hook1}}" }
      },
      "afterCreate": "{{fn:hook2}}",
      "beforeRegister": {
        "data": { "ref": "{{fn:hook3}}" }
      }
    }
  }]
}
`;
    const refs = extractSpecHookReferences(content);
    expect(refs).toContain('hook1');
    expect(refs).toContain('hook2');
    expect(refs).toContain('hook3');
  });

  it('沒 hooks 區塊 → 應回空陣列', () => {
    const content = `
{
  "models": [{
    "name": "simple",
    "fields": [{ "name": "title", "type": "string" }]
  }]
}
`;
    const refs = extractSpecHookReferences(content);
    expect(refs).toEqual([]);
  });

  it('沒 {{fn:...}} 引用 → 應回空陣列', () => {
    const content = `
{
  "models": [{
    "name": "simple",
    "hooks": {
      "beforeCreate": { "data": { "title": "literal" } }
    }
  }]
}
`;
    const refs = extractSpecHookReferences(content);
    expect(refs).toEqual([]);
  });

  it('deeply nested (3 層) 應支援', () => {
    const content = `
{
  "hooks": {
    "beforeCreate": {
      "data": {
        "nested1": {
          "nested2": {
            "deep": "{{fn:deepHook}}"
          }
        }
      }
    }
  }
}
`;
    const refs = extractSpecHookReferences(content);
    expect(refs).toContain('deepHook');
  });
});