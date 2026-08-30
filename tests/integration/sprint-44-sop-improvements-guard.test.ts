/**
 * Sprint 44 Commit C — §4.6 SOP 改進守護
 *
 * 問題揭露 (Sprint 43 reflection §4.6):
 * - 4 個連續端到端 bug 共同根因: '改動沒配套自動化'
 * - 開發流程缺統一驗證入口: typecheck / lint / test 三件分開跑容易漏
 * - Commit message 沒規範, 難以日後 review 跟 reflection
 *
 * 修法:
 * 1. package.json 加 validate script (typecheck + lint + test 一次跑完)
 * 2. CONTRIBUTING.md 加 commit message template
 *
 * 注意:
 * - 此 guard 是 pattern + filesystem check
 * - 真實 workflow 驗證交給日常開發 + reflection
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

describe('S44-C — §4.6 SOP 改進守護 (validate script + commit template)', () => {
  it('package.json 應有 validate script (typecheck + lint + test 一次跑完)', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    expect(
      pkg.scripts?.validate,
      'package.json scripts.validate 缺失'
    ).toBeDefined();
    expect(
      pkg.scripts.validate,
      'scripts.validate 應包含 typecheck + lint + test'
    ).toMatch(/typecheck/);
    expect(pkg.scripts.validate).toMatch(/lint/);
    expect(pkg.scripts.validate).toMatch(/test/);
  });

  it('package.json 應有 precommit hook (改 schema 後必跑 migrate)', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
    expect(
      pkg.scripts?.precommit || pkg.scripts?.['pre-commit'],
      'package.json 缺 precommit hook (改 schema 後應提醒 migrate)'
    ).toBeDefined();
  });

  it('CONTRIBUTING.md 應有 commit message template 含驗證步驟 checklist', () => {
    if (!existsSync('CONTRIBUTING.md')) {
      expect.fail('CONTRIBUTING.md 不存在');
      return;
    }
    const content = readFileSync('CONTRIBUTING.md', 'utf-8');
    // 應有 commit message template + 驗證步驟
    expect(content, 'CONTRIBUTING.md 缺 commit message template').toMatch(/commit.*message|message.*template/i);
    expect(content, 'CONTRIBUTING.md 缺驗證步驟 checklist').toMatch(/驗證|checklist|verify/i);
  });

  it('CONTRIBUTING.md 應有「改 schema 後跑 db:migrate」提醒', () => {
    if (!existsSync('CONTRIBUTING.md')) return;
    const content = readFileSync('CONTRIBUTING.md', 'utf-8');
    expect(content, 'CONTRIBUTING.md 缺 db:migrate 提醒').toMatch(/db:migrate|prisma\s+migrate/i);
  });

  it('CONTRIBUTING.md 應有 4 Gate SOP 描述 (TDD / lint / regression / reviewer)', () => {
    if (!existsSync('CONTRIBUTING.md')) return;
    const content = readFileSync('CONTRIBUTING.md', 'utf-8');
    // 4 Gate 關鍵字
    const hasTDD = /TDD|測試先紅後綠/i.test(content);
    const hasLint = /lint/i.test(content);
    const hasRegression = /regression/i.test(content);
    const hasReviewer = /reviewer|review/i.test(content);
    expect(hasTDD, 'CONTRIBUTING.md 缺 TDD Gate 說明').toBe(true);
    expect(hasLint, 'CONTRIBUTING.md 缺 lint Gate 說明').toBe(true);
    expect(hasRegression, 'CONTRIBUTING.md 缺 regression Gate 說明').toBe(true);
    expect(hasReviewer, 'CONTRIBUTING.md 缺 reviewer Gate 說明').toBe(true);
  });
});