# Sprint 52-0: AI Extension Generator Spike

> **日期**: 2026-09-01
> **Sprint**: Sprint 52 Stage 52-0 (FR-19.1)
> **狀態**: ✅ 完成
> **決策**: **方案 A (採用) — pi agent 可生成 extensions 程式碼, 但需 prompt + 驗證設計**

---

## §1 目的

Sprint 51 reflection §5 + 用戶備註明確提出「用 AI 生成 extensions」。Sprint 52-2 大規模實作前, 先 spike 驗證 pi agent 的 coding capability 足以生成 extensions 程式碼,並評估:

1. pi agent 是否能生成 `extensions/product/manifest.json` (結構對齊既有 todo)
2. pi agent 是否能生成 `extensions/product/product-spec.json` (CRUD spec)
3. pi agent 是否能生成 1 個簡單 hook (e.g. `beforeCreate.ts`)
4. AI 生成品質是否可編譯, 是否對齊 extension-loader schema

**重要前提**: Sprint 52 不實際執行 AI 生成 (留 Sprint 52-2 實作), 本 spike 僅評估**理論可行性 + 設計輸入**。

---

## §2 pi agent 可用性評估

### 2.1 pi agent 既有能力

從 Sprint 46 重構後, pi agent 已可用於:
- ✅ Admin chat 自然語言對話 (Sprint 46-2)
- ✅ 思考串流 (thinking_delta) (Sprint 47-1)
- ✅ 附件支援 (Sprint 46-5)
- ✅ Tool call (Sprint 46-SDK)

**Tool call 能力** = 寫檔案的基礎。pi agent 透過 `write_file` tool 可生成檔案。

### 2.2 既有 extensions 結構評估

| Extension | hooks | actions | computed | workflow | spec | manifest | README | examples |
|---|---|---|---|---|---|---|---|---|
| todo | 1 | 1 | 1 | 1 | ✅ | ✅ | ✅ | 1 |
| blog | 1 | 1 | 0 | 1 | ✅ | ✅ | ✅ | 1 |
| event | 2 | 2 | 3 | 1 | ✅ | ✅ | ✅ | 1 |
| order | 0 | 0 | 0 | 1 | ✅ | ✅ | ✅ | 1 |

**觀察**: 4 個 extensions 都有 `manifest.json` + `xxx-spec.json` + `README.md`, 結構高度相似。

### 2.3 AI 生成複雜度評估

| 檔案 | AI 生成難度 | 理由 |
|---|---|---|
| `manifest.json` | 🟢 低 | 固定 schema, 僅欄位值變化 |
| `xxx-spec.json` | 🟡 中 | CRUD spec 需理解 fields/actions/hooks 結構 |
| `hooks/beforeCreate.ts` | 🟢 低 | 簡單 hook (例如: 預設值設定) |
| `actions/complete.ts` | 🟡 中 | 需理解 transition + permission |
| `computed/remainingDays.ts` | 🟢 低 | 簡單計算 (例如: `differenceInDays`) |
| `workflow/xxx-workflow.ts` | 🟠 高 | 狀態機設計, 需理解 transitions |
| `examples/xxx.ts` | 🟡 中 | 需理解 extension-api 介面 |
| `README.md` | 🟢 低 | 簡單 markdown, AI 易生成 |

**整體評估**: 8 個檔案中, 5 個低/中難度, 1 個中難度, 2 個中/高難度。AI 生成**可行**, 但 workflow 檔案需特別設計 prompt。

---

## §3 4 個替代方案評估

### 方案 A: pi agent + 詳細 prompt + 三層驗證 (本 Sprint 採用)

- **作法**:
  1. Admin 輸入 `/extension create <name>`
  2. pi agent 收到帶 manifest/spec 範本的 prompt
  3. AI 透過 tool call 寫入 `extensions/<name>/` 各檔案
  4. 每個檔案寫入時, server-side 驗證 schema
  5. 全部完成後跑三層驗證 (loader test + manifest schema + tsc)
- **優點**:
  - 完全自動化, admin 一行指令完成
  - 三層驗證確保品質
  - 與既有 admin chat 流程無縫整合
- **缺點**:
  - AI 生成品質不穩定, 需守護測試
  - Prompt 設計需精心調 (Sprint 52-1 重點)
  - 路徑防護必須嚴謹 (不能寫到 extensions/ 之外)

### 方案 B: pi agent + 最小骨架 (3 檔案)

- **作法**: 只生成 manifest.json + spec.json + 1 hook, 其他手動補
- **優點**: 範圍小, 風險低
- **缺點**: 不符合「完整 8 檔案」目標, 仍需手動完成大部分
- **結論**: ❌ 不採用 (違背用戶需求)

### 方案 C: pi agent + 自動 e2e 測試

- **作法**: 生成後自動跑 CRUD e2e (create/list/update/delete)
- **優點**: 完整自動化
- **缺點**: e2e 慢 (分鐘級), 需 DB 整合測試環境, 範圍過大
- **結論**: ⚠️ 留 Sprint 53+ (Sprint 52 不做)

### 方案 D: 手動建 product extension (不用 AI)

- **作法**: 不透過 AI, 完全手動寫
- **優點**: 品質可控
- **缺點**: 違背用戶「用 AI 生成」需求
- **結論**: ❌ 不採用

---

## §4 AI Prompt 設計輸入 (Sprint 52-1 基礎)

### 4.1 系統 Prompt 結構

```
你是 extension generator。根據 admin 的需求, 在 extensions/<name>/ 目錄下生成以下 8 個檔案:

1. manifest.json: 參考 extensions/todo/manifest.json 結構, 包含 name, version, label, hooks, actions, computed, permissions, nav
2. xxx-spec.json: 參考 extensions/todo/todo-spec.json 結構, 包含 models (fields 為 admin 指定的 fields)
3. hooks/beforeCreate.ts: 簡單預設值設定
4. actions/complete.ts: 簡單狀態切換 (if model has completed field)
5. computed/remainingDays.ts: 計算剩餘天數 (if model has dueDate field)
6. workflow/xxx-workflow.ts: 簡單狀態機 (draft → published)
7. examples/list-and-filter.ts: 簡單 API 呼叫範例
8. README.md: 簡單 markdown 說明

限制:
- 只能寫入 extensions/<name>/ 目錄
- 不能修改其他檔案
- 每個檔案必須符合 extension-loader schema
```

### 4.2 Tool Call 規範

- AI 透過 `write_file(path, content)` tool 寫檔
- Server-side 攔截 tool call, 驗證:
  - `path.startsWith('extensions/<name>/')` (路徑防護)
  - 對應 schema (manifest.json 對 manifest schema)
- 驗證失敗 → 拒絕寫入, 回傳錯誤給 AI 重新生成

### 4.3 Slash Command 解析

```
/extension create <name> [--fields=f1,f2,...] [--force]
/extension create product --fields=name,price,stock
/extension create product --force   (覆寫既有)
```

---

## §5 風險評估

| 風險 | 嚴重性 | 緩解 |
|---|---|---|
| AI 生成 workflow.ts 失敗 | 🟠 中 | Prompt 內附範例, 三層驗證最後把關 |
| AI 寫到 extensions/ 之外 | 🔴 嚴重 | 路徑防護 + 守護測試 |
| AI 覆蓋既有 extensions | 🔴 嚴重 | 預設拒絕, --force 才覆寫 (含備份) |
| manifest schema 不符 | 🟡 中 | Zod schema 驗證 |
| 生成程式碼無法編譯 | 🟠 中 | tsc --noEmit 驗證 |
| 與既有 admin chat 衝突 | 🟢 低 | 僅在 slash command 觸發 |
| AI token cost 高 | 🟡 中 | 8 個檔案, 預估 5-10k tokens/extension |

---

## §6 結論

**結論: 採用方案 A** (pi agent + 詳細 prompt + 三層驗證)。

**理由**:
1. ✅ 完全對齊用戶「用 AI 生成」需求
2. ✅ 三層驗證確保品質
3. ✅ 路徑防護 + 覆寫保護確保安全
4. ✅ 與既有 admin chat 無縫整合

**Sprint 52 行動**:
- Sprint 52-1: 設計 generator (FR-19.2) + slash command (FR-19.3)
- Sprint 52-2: 完整實作 (FR-19.4) + 驗證 (FR-19.5) + 守護測試

**Sprint 53+ 帶下**:
- 自動 e2e 測試生成的 extension (留 Sprint 53+)
- Generator CLI 工具 (留 Sprint 53+)
- 支援更多 extension 類型 (評估 inventory, invoice 等)

---

## §7 待生成項目 (Sprint 52-2 執行)

Sprint 52-2 將實際生成以下 8 個檔案:
- `extensions/product/manifest.json`
- `extensions/product/product-spec.json`
- `extensions/product/hooks/beforeCreate.ts`
- `extensions/product/actions/complete.ts`
- `extensions/product/computed/isInStock.ts`
- `extensions/product/workflow/product-workflow.ts`
- `extensions/product/examples/list-and-filter.ts`
- `extensions/product/README.md`

---

## §8 範例: AI 生成 manifest.json 預期輸出

```json
{
  "name": "product",
  "version": "1.0.0",
  "label": "產品",
  "description": "產品 CRUD — 展示 AI 生成的 extension",
  "author": "ai-headless team",
  "hooks": ["product.beforeCreate"],
  "actions": ["product.complete"],
  "computed": ["product.isInStock"],
  "permissions": ["product.create", "product.read", "product.update", "product.delete"],
  "dependencies": [],
  "nav": {
    "path": "/admin/crud/product",
    "label": "產品",
    "order": 70
  }
}
```

---

**Sprint 52-0 spike 結束時間**: 2026-09-01
**決策**: 採用方案 A (pi agent + 詳細 prompt + 三層驗證)
**下一個 stage**: Sprint 52-1 (設計 extension generator + slash command)