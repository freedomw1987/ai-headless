/**
 * TD-519 — Order 列表分頁 守護測試 (source-code guard)
 *
 * 為什麼需要：
 * - TD-519 backlog: "訂單 >50 筆會慢，沒分頁"
 * - 但 Sprint 19 已為所有 CRUD specs 加分頁（含 Order）
 * - 本測試守護：dynamic-handler.list 必須包含 skip + take
 *
 * Gate 1 TDD：source-code guard（防止分頁邏輯被後續改動移除）
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const HANDLER_PATH = 'lib/runtime/dynamic-handler.ts';
const handlerSource = readFileSync(HANDLER_PATH, 'utf-8');

describe('TD-519 — Order 列表分頁 (handler guard)', () => {
  it('handler.list 有讀取 page 參數', () => {
    expect(handlerSource).toMatch(/ctx\.query\?\.page|query\.page/);
  });

  it('handler.list 有讀取 pageSize 參數', () => {
    expect(handlerSource).toMatch(/ctx\.query\?\.pageSize|query\.pageSize/);
  });

  it('handler.list 計算 skip（offset）', () => {
    expect(handlerSource).toMatch(/const\s+skip\s*=/);
    // skip = (page - 1) * pageSize
    expect(handlerSource).toMatch(/skip\s*=\s*\(page\s*-\s*1\)\s*\*\s*pageSize/);
  });

  it('handler.list 的 findMany 使用 skip + take', () => {
    // findMany 必須同時傳 skip 跟 take 才有分頁效果
    expect(handlerSource).toMatch(/findMany\([\s\S]*?skip[\s\S]*?take[\s\S]*?\)/);
  });

  it('handler.list 有 max pageSize 上限保護', () => {
    // pageSize 必須有上限（避免一次撈太多筆）
    // 允許 `rawPageSize <= 100` 或其他上限表達
    expect(handlerSource).toMatch(/rawPageSize\s*<=\s*\d+|pageSize\s*<=\s*\d+/);
  });
});