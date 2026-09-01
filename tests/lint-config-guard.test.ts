/**
 * Sprint 48 Commit 1 (Stage 48-1) — Lint Config Guard
 *
 * 對應 PRD: docs/prd/11-chat-v2-completions.md §2.10 (FR-9.1 ~ 9.3)
 *
 * 守護目的:
 * - 確保 6 個 pre-existing lint 錯誤修完後, 不會被新程式碼復發
 * - 驗證 ESLint config 包含必要 rules (不再出現 "rule not found")
 *
 * 對應 Sprint 47 reflection 揭露:
 * - react-hooks/exhaustive-deps (admin-sidebar.tsx, settings/page.tsx, crud-list-client.tsx)
 * - await-thenable (roles/page.tsx, users/page.tsx)
 * - no-floating-promises (conversation.tsx)
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

describe('S48-1 — Lint Config Guard (FR-9.1 ~ 9.3)', () => {
  describe('ESLint config 完整性', () => {
    it('應有 eslint config 檔案', () => {
      const configFiles = [
        '.eslintrc.json',
        '.eslintrc.js',
        '.eslintrc.cjs',
        '.eslintrc.yaml',
        '.eslintrc.yml',
        'eslint.config.js',
        'eslint.config.mjs',
      ];
      const exists = configFiles.some((f) => existsSync(f));
      expect(exists, '應有 ESLint config 檔案').toBe(true);
    });

    it('config 應包含 react-hooks plugin 規則 (或明確不安裝)', () => {
      // 從 package.json 或 config 檢查
      let configContent = '';
      const configFiles = [
        '.eslintrc.json',
        '.eslintrc.js',
        '.eslintrc.cjs',
        'eslint.config.js',
        'eslint.config.mjs',
      ];
      for (const f of configFiles) {
        if (existsSync(f)) {
          configContent = readFileSync(f, 'utf-8');
          break;
        }
      }
      // 若是 package.json 中的 eslintConfig
      if (!configContent && existsSync('package.json')) {
        const pkg = JSON.parse(readFileSync('package.json', 'utf-8')) as Record<
          string,
          unknown
        >;
        if (pkg.eslintConfig) {
          configContent = JSON.stringify(pkg.eslintConfig);
        }
      }
      expect(configContent, '應有 config 內容').not.toBe('');
      // Sprint 48-1 決策: 不安裝 eslint-plugin-react-hooks (避免新依賴),
      // 改為刪除多餘的 disable-next-line comments + 用 prettier/smart refactor 避免依賴閉包。
      // 守護: 不應出現 "Definition for rule ... not found" 警告。
      expect(
        configContent,
        'config 不應引用未安裝的 react-hooks plugin',
      ).not.toMatch(/react-hooks|exhaustive-deps/);
    });
  });

  describe('Pre-existing lint errors 守護', () => {
    // Sprint 48-4.1 hotfix: 從 FIXED_FILES 移除 settings/page.tsx
    // Sprint 48 mid-review audit §3: Sprint 48-1 實際只修了 5 個檔, 沒修 settings/page.tsx
    // 誠實守護: 只列實際有動的檔
    const FIXED_FILES = [
      'app/admin/admin-sidebar.tsx',
      'app/admin/crud/[spec]/crud-list-client.tsx',
      'app/admin/roles/page.tsx',
      'app/admin/users/page.tsx',
      'components/ai-elements/conversation.tsx',
    ];

    for (const filePath of FIXED_FILES) {
      it(`${filePath} 不應有 react-hooks disable-next-line comment (Sprint 48-1 已清)`, () => {
        if (!existsSync(filePath)) return;
        const source = readFileSync(filePath, 'utf-8');
        // Sprint 48-4.1 hotfix: 從恒等式斷言 (永遠 true) 改成有意義斷言
        // Sprint 48 mid-review audit §3: 原守護 disableMatches === null || disableMatches.length >= 0 是恒等式
        // 現改為: 固定檔案不應有 react-hooks/exhaustive-deps disable
        const reactHooksDisable = source.match(
          /eslint-disable-next-line[^]*react-hooks\/exhaustive-deps/,
        );
        expect(
          reactHooksDisable,
          `${filePath} 不應有 react-hooks disable (Sprint 48-1 已清)`,
        ).toBeNull();
      });
    }
  });

  describe('Lint 執行結果', () => {
    it('pnpm lint 不應有 Error (可接受 Warning)', () => {
      let output = '';
      try {
        output = execSync('pnpm lint 2>&1', {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
      } catch (err) {
        // pnpm lint exit code != 0 時, 從 stderr 抓錯誤訊息
        const errMsg = err instanceof Error ? err.message : String(err);
        output = errMsg;
      }
      // 計算 Error 數量 (每個 Error: 開頭)
      const errorLines = output.split('\n').filter((line) =>
        /\bError:/.test(line),
      );
      expect(
        errorLines.length,
        `pnpm lint 不應有 Error (實際: ${errorLines.length})\n${errorLines.slice(0, 10).join('\n')}`,
      ).toBe(0);
    }, 60000);
  });
});