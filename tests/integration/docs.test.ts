/**
 * TDD Gate 1 — S3.6 文檔站點完整性測試
 *
 * 涵蓋：
 * 1. 必要文件存在（README / CHANGELOG / getting-started / index）
 * 2. README 含關鍵章節
 * 3. CHANGELOG 含 Sprint 1-3
 * 4. docs/index.md 含所有鏈接
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const ROOT = process.cwd();

describe('S3.6 必要文件存在', () => {
  it('README.md 存在', () => {
    expect(fs.existsSync(path.join(ROOT, 'README.md'))).toBe(true);
  });

  it('CHANGELOG.md 存在', () => {
    expect(fs.existsSync(path.join(ROOT, 'CHANGELOG.md'))).toBe(true);
  });

  it('docs/getting-started.md 存在', () => {
    expect(fs.existsSync(path.join(ROOT, 'docs/getting-started.md'))).toBe(true);
  });

  it('docs/index.md 存在', () => {
    expect(fs.existsSync(path.join(ROOT, 'docs/index.md'))).toBe(true);
  });

  it('docs/backlog.md 存在', () => {
    expect(fs.existsSync(path.join(ROOT, 'docs/backlog.md'))).toBe(true);
  });

  it('docs/system-design.md 存在', () => {
    expect(fs.existsSync(path.join(ROOT, 'docs/system-design.md'))).toBe(true);
  });

  it('docs/DESIGN.md 存在', () => {
    expect(fs.existsSync(path.join(ROOT, 'docs/DESIGN.md'))).toBe(true);
  });

  it('docs/specs/json-spec.md 存在', () => {
    expect(fs.existsSync(path.join(ROOT, 'docs/specs/json-spec.md'))).toBe(true);
  });

  it('docs/specs/extension-spec.md 存在', () => {
    expect(fs.existsSync(path.join(ROOT, 'docs/specs/extension-spec.md'))).toBe(true);
  });

  it('8 個 PRD 文件都存在', () => {
    const prdFiles = fs.readdirSync(path.join(ROOT, 'docs/prd'));
    const prdMd = prdFiles.filter((f) => f.endsWith('.md'));
    expect(prdMd.length).toBeGreaterThanOrEqual(8);
    for (let i = 1; i <= 8; i++) {
      const num = i.toString().padStart(2, '0');
      expect(prdMd.find((f) => f.startsWith(num))).toBeDefined();
    }
  });
});

describe('S3.6 README 內容', () => {
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf-8');

  it('含核心特性章節', () => {
    expect(readme).toMatch(/## ✨ 核心特性/);
  });

  it('含快速開始', () => {
    expect(readme).toMatch(/## 🚀 快速開始/);
  });

  it('含 Quick Start bash 區塊', () => {
    expect(readme).toContain('bun install');
    expect(readme).toContain('bun run dev');
  });

  it('含三大入口', () => {
    expect(readme).toContain('/chat');
    expect(readme).toContain('/admin/extensions');
  });

  it('含專案結構', () => {
    expect(readme).toMatch(/## 📂 專案結構/);
  });

  it('含測試章節', () => {
    expect(readme).toMatch(/## 🧪 測試/);
    expect(readme).toContain('bunx vitest --run');
  });

  it('含 AI Pipeline 工作流圖', () => {
    expect(readme).toMatch(/## 🏗️ AI Pipeline/);
    expect(readme).toContain('自然語言需求');
    expect(readme).toContain('JsonSpec');
  });

  it('含 Extension 範例', () => {
    expect(readme).toMatch(/## 🔌 Extension 範例/);
  });

  it('含當前狀態統計', () => {
    expect(readme).toMatch(/## 📊 當前狀態/);
    expect(readme).toContain('468');
  });

  it('含貢獻指南', () => {
    expect(readme).toMatch(/## 🤝 貢獻/);
  });
});

describe('S3.6 CHANGELOG 內容', () => {
  const changelog = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf-8');

  it('含 Sprint 1', () => {
    expect(changelog).toContain('Sprint 1');
  });

  it('含 Sprint 2', () => {
    expect(changelog).toContain('Sprint 2');
  });

  it('含 Sprint 3', () => {
    expect(changelog).toContain('Sprint 3');
  });

  it('含 S3.1-S3.6 所有子任務', () => {
    expect(changelog).toContain('S3.1');
    expect(changelog).toContain('S3.2');
    expect(changelog).toContain('S3.3');
    expect(changelog).toContain('S3.4');
    expect(changelog).toContain('S3.5');
    expect(changelog).toContain('S3.6');
  });

  it('含 TD-302/304/305 修復記錄', () => {
    expect(changelog).toContain('TD-302');
    expect(changelog).toContain('TD-304');
    expect(changelog).toContain('TD-305');
  });

  it('含統計數據', () => {
    expect(changelog).toContain('468');
  });
});

describe('S3.6 getting-started 內容', () => {
  const gs = fs.readFileSync(path.join(ROOT, 'docs/getting-started.md'), 'utf-8');

  it('含 5 個步驟', () => {
    expect(gs).toContain('步驟 1');
    expect(gs).toContain('步驟 2');
    expect(gs).toContain('步驟 3');
    expect(gs).toContain('步驟 4');
    expect(gs).toContain('步驟 5');
  });

  it('含安裝指令', () => {
    expect(gs).toContain('bun install');
  });

  it('含建立 Extension 範例', () => {
    expect(gs).toContain('beforeCreateItem');
    expect(gs).toContain('manifest.json');
  });

  it('含 FAQ 章節', () => {
    expect(gs).toMatch(/## 🔧 常見問題/);
  });
});

describe('S3.6 docs/index.md 內容', () => {
  const index = fs.readFileSync(path.join(ROOT, 'docs/index.md'), 'utf-8');

  it('含入門、規範、PRD 三大區塊', () => {
    expect(index).toContain('入門');
    expect(index).toContain('規範');
    expect(index).toContain('PRD');
  });

  it('鏈接 8 個 PRD', () => {
    for (let i = 1; i <= 8; i++) {
      const num = i.toString().padStart(2, '0');
      expect(index).toContain(num);
    }
  });

  it('鏈接 README / CHANGELOG', () => {
    expect(index).toContain('README.md');
    expect(index).toContain('CHANGELOG.md');
  });
});

describe('S3.6 extensions/ 目錄文檔', () => {
  it('extensions/README.md 存在', () => {
    expect(fs.existsSync(path.join(ROOT, 'extensions/README.md'))).toBe(true);
  });

  it('extensions/todo/README.md 存在', () => {
    expect(fs.existsSync(path.join(ROOT, 'extensions/todo/README.md'))).toBe(true);
  });

  it('extensions/event/README.md 存在', () => {
    expect(fs.existsSync(path.join(ROOT, 'extensions/event/README.md'))).toBe(true);
  });
});