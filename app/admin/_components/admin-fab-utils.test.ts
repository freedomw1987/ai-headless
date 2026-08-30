/**
 * Sprint 44 Commit D — snapToEdge 純函數單元測試
 */

import { describe, it, expect } from 'vitest';
import { snapToEdge } from './admin-fab';

describe('S44-D snapToEdge 純函數', () => {
  it('應 snap 到左邊 (x 在左半邊)', () => {
    const result = snapToEdge(100, 500, 1000, 1000);
    expect(result.x).toBe(0);
  });

  it('應 snap 到右邊 (x 在右半邊)', () => {
    const result = snapToEdge(900, 500, 1000, 1000);
    // viewport - fabSize = 1000 - 56 = 944
    expect(result.x).toBe(944);
  });

  it('應 snap 到頂部 (y 在上半邊)', () => {
    const result = snapToEdge(500, 100, 1000, 1000);
    expect(result.y).toBe(0);
  });

  it('應 snap 到底部 (y 在下半邊)', () => {
    const result = snapToEdge(500, 900, 1000, 1000);
    expect(result.y).toBe(944);
  });

  it('左下角 snap (x 左, y 下)', () => {
    const result = snapToEdge(100, 900, 1000, 1000);
    expect(result.x).toBe(0);
    expect(result.y).toBe(944);
  });

  it('右上角 snap (x 右, y 上)', () => {
    const result = snapToEdge(900, 100, 1000, 1000);
    expect(result.x).toBe(944);
    expect(result.y).toBe(0);
  });

  it('應支援自訂 fabSize', () => {
    const result = snapToEdge(900, 900, 1000, 1000, 100);
    expect(result.x).toBe(900);
    expect(result.y).toBe(900);
  });

  it('邊界 case: 中心點剛好在中線', () => {
    const result = snapToEdge(500, 500, 1000, 1000);
    // 500 == 500 (中線), 因 < 比較嚴格, 會 snap 到右
    expect(result.x).toBe(944);
    expect(result.y).toBe(944);
  });
});