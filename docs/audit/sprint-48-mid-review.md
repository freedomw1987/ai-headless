# Sprint 48 Mid-Sprint Review（2026-09-01）

> **範圍**：Sprint 48 Commit 1（lint cleanup）、Commit 2（ChatStatus 重構）、Commit 3（upload helper 統一）、未 commit 的 Commit 4 spike（Office Rest bundle）
> **重點**：correctness risks、UX regressions、missing tests、follow-up tasks
> **嚴重程度排序**：🔴 必修 / 🟡 應修 / 🟢 nice-to-have

---

## 🔴 必修（P0 — 必須修 before Sprint 48-5）

### 1. Sprint 48-2「切斷 'ai' SDK 依賴」宣告未達成（CORRECTNESS / 守護失效）

**檔案**：
- `components/ai-elements/prompt-input.tsx:43`
- `components/ai-elements/conversation.tsx:5`
- `components/ai-elements/message.tsx:19`

Sprint 48-2 commit message 明確寫「**取代從 'ai' SDK import ChatStatus, 切斷全專案對 'ai' SDK 型別的依賴**」。實際上 `components/ai-elements/` 三個檔案仍然從 `"ai"` 雙引號 import 型別：

```ts
// prompt-input.tsx:43  ← 還在 import ChatStatus from "ai"！
import type { ChatStatus, FileUIPart, SourceDocumentUIPart } from "ai";

// conversation.tsx:5
import type { UIMessage } from "ai";

// message.tsx:19
import type { UIMessage } from "ai";
```

其中 `prompt-input.tsx:1212` 用 `ChatStatus` 作為 `status?: ChatStatus` 的 prop 型別 — `ChatStatus` 仍來自 `'ai'` SDK。如果未來 `'ai'` SDK 改值（例如新增 `'awaiting'` 或改名），Sprint 48-2 自訂的 `chat-utils.ts:35` 的 `ChatStatus` 與 `prompt-input.tsx` 的 ChatStatus 會**靜默分歧**：

- `app/admin/_components/use-chat-stream.ts` 走自訂型別（4 值）
- `components/ai-elements/prompt-input.tsx` 走 `'ai'` SDK 型別（隨 SDK 變動）
- TypeScript 對「兩個相同字面量 union」視為相容，所以**編譯期抓不到**，runtime 才出問題

**根因**：守護測試 `lib/ai/chat/chat-status-guard.test.ts:84` 的 grep 只匹配**單引號** `from 'ai'`，但本專案用**雙引號** `from "ai"` — 守護形同虛設：

```ts
// 當前 regex（只抓單引號）
result = execSync(`grep -rn "from 'ai'" app/ lib/ components/ 2>&1 || true`, ...);
const chatStatusImports = result.split('\n')
  .filter((line) => /from\s+'ai'/i.test(line) && /ChatStatus/i.test(line));
```

`prompt-input.tsx` 的 `from "ai"` 完全不被偵測 → guard 綠燈通過，違規仍然存在。

**修正建議**（兩件都要做）：

1. **修守護 regex**（最低成本，立刻可做）：
   ```ts
   // 接受單/雙引號
   result = execSync(
     `grep -rEn 'from[[:space:]]+["'\'']ai["'\'']' app/ lib/ components/ 2>&1 || true`,
     ...
   );
   const chatStatusImports = result.split('\n')
     .filter((line) => /from\s+["']ai["']/i.test(line) && /ChatStatus/i.test(line));
   ```

2. **Sprint 48-5 內**：把 `prompt-input.tsx`、`conversation.tsx`、`message.tsx` 都改成從 `@/lib/ai/chat/chat-utils` import（或新增 `UIMessage` 本地替代型別）。注意 `UIMessage` 是 `'ai'` SDK 的核心型別，替代成本較高，可分批：先把 `ChatStatus` 統一，再處理 `UIMessage`。

---

### 2. Upload route 重構改了使用者可見的錯誤訊息（UX regression）

**檔案**：`app/api/admin/chat/upload/route.ts:70`

```ts
// 舊（內聯）
{ error: 'Session does not belong to user', status: 403 }

// 新（helper）
{ error: 'Session does not belong to current user', status: 403 }
//                              ^^^^^^^^^^^^^^^^^^
```

`lib/auth/session-ownership.ts:65` 寫的是 `'Session does not belong to current user'`，舊 upload route 寫的是 `'Session does not belong to user'`。

**影響**：
- 使用者看到的英文錯誤訊息字串不同（user → current user）
- 若 frontend 有 i18n key 對應 `'Session does not belong to user'`，會 fallback 到預設英文；新訊息也沒進 i18n table
- 任何 E2E / integration test 用字串匹配斷言都會壞

**修正建議**：在 helper 層統一錯誤訊息文案（建議 `'Session does not belong to current user'` 為 canonical），前端 i18n 同步更新 key；如果有依賴舊訊息的測試一併更新。

**守護缺口**：`tests/upload-ownership-helper-guard.test.ts` 只斷言「使用 helper / 不再有內聯 findUnique」，沒斷言**錯誤訊息字串穩定**。建議加一條：
```ts
it('helper 應拋出固定錯誤訊息 (Sprint 48-3 行為等價保證)', () => {
  const source = readFileSync('lib/auth/session-ownership.ts', 'utf-8');
  expect(source).toContain("'Session does not belong to current user'");
});
```

---

### 3. Sprint 48-1「修 6 個 lint 錯誤」實際只動 5 個檔案 + 規則未啟用（CORRECTNESS / 宣稱 vs 實作）

**檔案**：
- 應修清單（per Sprint 47 reflection §問題 3）：`admin-sidebar.tsx`, `settings/page.tsx`, `crud-list-client.tsx`, `roles/page.tsx`, `users/page.tsx`, `conversation.tsx`
- 實際 commit `8518fd0` 觸碰：`admin-sidebar.tsx`, `crud-list-client.tsx`, `roles/page.tsx`, `users/page.tsx`, `conversation.tsx`（**5 個，缺 `settings/page.tsx`**）
- 但守護 `tests/lint-config-guard.test.ts:75-83` 的 `FIXED_FILES` 仍把 `settings/page.tsx` 列為「已修」

**更深問題**：`react-hooks/exhaustive-deps` rule 根本**不在** `eslint.config.mjs` 啟用（grep 結果：0 hit）。所以「刪 disable-next-line comment」實際上**沒有消除任何 lint 違規** — 因為規則根本沒跑。Sprint 48-1 commit message 寫「決策：不安裝 eslint-plugin-react-hooks」，但既然沒裝，「刪 disable comment」只是 cosmetic 動作。

**影響**：
- Sprint 47 reflection 說「6 個 lint 錯誤」，Sprint 48-1 修了 5 個檔（刪多餘 disable comment），聲稱 4 Gate 全綠。但實際 lint warning 數量可能沒變（因為 rule 沒啟用）
- `settings/page.tsx` 從守護 FIXED_FILES 移除 vs 保留不一致 — 若保留但未來真的裝 react-hooks plugin，會被 `disable comment 缺失 + 規則違規` 雙重打擊
- `tests/lint-config-guard.test.ts:91-94` 的 `disableMatches === null || disableMatches.length >= 0` 是恆等式（永遠 true），守護沒實際斷言任何東西

**修正建議**：

1. **誠實標註**：`settings/page.tsx` 從 `FIXED_FILES` 移除，或在 sprint 48-1 commit message 加註「未動此檔」。commit message 不能事後修，但 reflection 文件可補。
2. **強化守護**：把恆等式斷言改成有意義的：
   ```ts
   // 改為：固定檔案不應再出現 disable-next-line for react-hooks (Sprint 48-1 已清)
   const reactHooksDisable = source.match(/eslint-disable-next-line[^]*react-hooks\/exhaustive-deps/);
   expect(reactHooksDisable, `${filePath} 不應有 react-hooks disable`).toBeNull();
   ```
3. **補 `settings/page.tsx`**：確認它有沒有真的需要 disable comment；如果原本就沒裝 plugin，那 Sprint 47 reflection 的「lint 錯誤」描述就值得覆盤。

---

## 🟡 應修（P1 — Sprint 48-5 開始前修）

### 4. Office Rest spike 守護測試全是「找不到就 skip」（MISSING TESTS）

**檔案**：`tests/office-rest-spike.test.ts`

整個檔案 12 個測試都遵循這個 pattern：

```ts
const jszipModule = tryRequire('jszip');
if (!jszipModule) {
  console.warn('jszip 未安裝, Sprint 48-5 需 pnpm add jszip');
  return;  // ← 沒斷言就直接 return, 測試通過
}
```

**問題**：
- Sprint 48-5 應裝 `jszip` + `fast-xml-parser`，但這個測試**即使忘記裝也會全綠通過**
- 「守護」的反義詞 — 它對 Sprint 48-5 沒完成裝依賴的狀態毫無偵測能力
- `mammoth-docx-fixture.docx` 名字（line 163）跟實際 fixture `sample.docx`（`tests/fixtures/office-parser/`）不一致 — 效能測試永遠走 skip 分支

**修正建議**：

1. **改守護為「應該裝」而非「可能裝」**：
   ```ts
   it('Sprint 48-5 應已安裝 jszip', () => {
     const jszipModule = tryRequire('jszip');
     expect(jszipModule, 'jszip 應已安裝 (Sprint 48-5 deliverable)').not.toBeNull();
   });
   ```
2. **修 fixture 路徑**：用實際存在的 `sample.docx` / `sample.xlsx`，並在 Sprint 48-5 補 `sample.pptx`（spike doc §5 已列為交付）。
3. **PPTX 解析測試**目前只驗「ZIP 結構 + slide 檔存在」，沒驗證**真的能抽出 `<a:t>` 文字節點**。Sprint 48-5 實作 `pptx-parser.ts` 時，這個測試應升級為「解析 + 斷言文字內容」。

---

### 5. Bundle 計算漏算 pdf-parse（FOLLOW-UP）

**檔案**：`docs/spike/sprint48-office-rest.md` §2, §4.3

spike 文件計算 Office Rest 增量：

| 套件 | 大小 |
|------|------|
| mammoth | 2.4 MB |
| xlsx | 7.2 MB |
| jszip | 880 KB |
| fast-xml-parser | TBD |
| **總計（已裝部分）** | **10.5 MB** |

但 Sprint 47-4 引入的 **`pdf-parse v2`** 不在此表。實際 server-side PDF+Office 總量需另算（推估 +5~8 MB）。

**影響**：Vercel serverless function size limit 是 50 MB（zip 後）/ 250 MB（unzip）。當前 spike 的「~10 MB」是 partial figure，false reassurance。

**修正建議**：spike §2 加一行「**未含 pdf-parse（Sprint 47-4），總量另計**」；Sprint 48-5 整合後量一次 `.next/server` 實際大小。

---

### 6. jszip 是 transitive dependency，未正式聲明（FOLLOW-UP / 風險）

**檔案**：`docs/spike/sprint48-office-rest.md` §2

```markdown
> **重要發現**：jszip 880 KB 已經在 `node_modules/.pnpm/jszip@3.10.1`，
> 但 `package.json` 沒有列為直接依賴
```

Sprint 48-5 雖列為「`pnpm add jszip` 正式列入」，但**沒人驗證是哪個 transitive 把 jszip 拉進來**。如果 Sprint 48-5 之前有任何套件升級移除掉這個 transitive，`pnpm install` 之後 jszip 會消失 — 在 CI 環境尤其危險（lockfile 行為可能不同）。

**修正建議**：Sprint 48-5 第一步先 `pnpm why jszip`，確認 transitive 來源；正式列入 `package.json` 後再 `pnpm install --frozen-lockfile` 驗證 CI 也裝得到。

---

## 🟢 nice-to-have（P2 / Sprint 49+ backlog）

### 7. Sprint 48-2 沒處理 `UIMessage`（既知技術債）

`components/ai-elements/conversation.tsx`、`message.tsx` 用 `UIMessage` from `"ai"` 是 Sprint 45 起的既定方向（自訂 `ChatMessage` 而非用 SDK 的 `UIMessage`）。Sprint 48-2 只處理 `ChatStatus` 是合理的範圍切割，但**全專案對 `'ai'` SDK 型別的依賴仍未切乾淨**（守護測試是 broken 的，見問題 #1）。

→ Backlog: `TD-S48-CutAISDKTypeDeps`（P1）

### 8. `US-S48-SourcesList` 仍待辦（從 Sprint 47 reflection 帶下）

Sprint 47 reflection §問題 1 (P1)：Sources 折疊區降階方案，完整 SourcesList 未實作。Sprint 48 plan 已標 ⏸️ 留 Sprint 49+。

→ Backlog: `US-S48-SourcesList`（P1）

### 9. Sprint 48-4 spike doc 缺 fixture 大小 + 解析時間實測數據

spike §4.2 表格大量標示「（待 fixture）」— Sprint 48-5 完成後應回填實際數字（DOCX/XLSX/PPTX 解析時間、樣本檔大小），作為後續 bundle 預估的 baseline。

---

## 總結：Sprint 48-5 開工前 checklist

| # | 動作 | 優先 | 預估 SP |
|---|------|------|---------|
| 1 | 修 `chat-status-guard.test.ts` 的 grep regex（單/雙引號都抓） | 🔴 | 0.1 |
| 2 | 統一 upload route 錯誤訊息字串 + 補守護 | 🔴 | 0.1 |
| 3 | 從 `FIXED_FILES` 移除 `settings/page.tsx` 或補實際修改 | 🔴 | 0.1 |
| 4 | 強化 `lint-config-guard.test.ts` 守護（修恆等式斷言） | 🟡 | 0.2 |
| 5 | 改 `office-rest-spike.test.ts` 為「必須裝」守護 + 修 fixture 路徑 | 🟡 | 0.3 |
| 6 | `pnpm why jszip` 確認 transitive 來源 | 🟡 | 0.1 |
| 7 | Sprint 48-5 補 `sample.pptx` fixture + PPTX 解析整合測試 | 🟡 | 0.5 |
| **小計** | | | **~1.4 SP** |

**Sprint 48-5 仍可開工，但開工前先把 🔴 三項修完**，避免 Office Rest 程式碼建立在新一層的技術債上。

---

## 對齊 SOP 紀律

- ✅ 觸發 Gate 4 Reviewer 維度（功能 / 品質 / 測試 / 既有 / PRD / 安全）
- ✅ 對應 Sprint 47 reflection P2 揭露問題（#2/#3 是 P2 升 P0 的實例）
- ✅ 守護測試本身也是審查對象（#1, #3, #4 — guard 失效比 production bug 更難抓）
- ⏸️ Sprint 48 Submit Gate（reflection）需把 #1 #3 #4 #5 列入 Sprint 49 backlog