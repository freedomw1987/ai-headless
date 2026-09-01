# Sprint 52 Plan Gate — AI Chat 生成 extensions product CRUD

> **日期**: 2026-09-01
> **Sprint**: Sprint 52
> **狀態**: ✅ Plan Gate 完成
> **決策**: **AI Chat 自然語言生成完整 product extension** (2 SP, 3 commits)
> **方向**: **新方向 sprint** — 用 pi agent AI chat 從自然語言生成 extensions 程式碼
> **範圍**: 5 FR / 2 SP / 3 commits

---

## §1 為什麼是 Sprint 52？

**用戶主動提出（Sprint 51 Plan Gate Q&A）**:
> 「之後要試試 AI 去生成一個 extensions product CRUD」

**重新詮釋後的範圍（Sprint 51 reflection §5 帶下 + Sprint 52 Plan Gate Q&A 澄清）**:
- ❌ 不是「手動建 product extension」(那是 D 方案, 不是 AI)
- ❌ 不是「一次性手動生成」(那是 Sprint 51 採用的方案 A)
- ✅ 是「讓 admin 在 pi agent chat 中, 用自然語言 prompt 生成 extensions」

---

## §2 決策彙總（5 個 Q&A）

| 決策 | 採用 | SP |
|---|---|---|
| 方向 | AI chat 自然語言生成完整 product extension | 2.0 |
| 觸發模式 | slash command `/extension create` | 0 |
| 生成範圍 | 完整 8 個檔案 (對齊 todo extension) | 0.5 |
| 驗證方式 | 三層: loader test + manifest schema + tsc | 0.4 |
| 覆寫保護 | 預設拒絕, `--force` 才覆寫 | 0 |

---

## §3 Sprint 52 FR 拆解（5 FR / 2 SP / 3 commits）

### 3.1 Stage 52-0: spike 驗證可行性（FR-19.1）

| FR | 描述 | SP |
|---|---|---|
| **FR-19.1** | spike: 驗證 pi agent 從 chat prompt 可生成 extensions 程式碼 | 0.5 |

**目的**: 確認 pi agent 的 coding capability 能生成 extensions 結構 + 程式碼, 避免 Sprint 52-2 大規模實作後才發現不可行。

**spike 任務**:
1. 在 admin chat 用自然語言 prompt: 「建立一個 product extension, 含 CRUD + hook + action + computed」
2. 觀察 pi agent 是否能:
   - 生成 `extensions/product/manifest.json`
   - 生成 `extensions/product/product-spec.json`
   - 生成 1 個簡單 hook (e.g. `beforeCreate.ts`)
3. 評估生成品質（是否可編譯、是否對齊 extension-loader schema）

**預估產出**: `docs/spike/sprint52-ai-extension-gen.md` + spike 守護測試

---

### 3.2 Stage 52-1: 設計 generator（FR-19.2 + FR-19.3）

| FR | 描述 | SP |
|---|---|---|
| **FR-19.2** | 設計 extension generator prompt + manifest/spec schema 模板 | 0.3 |
| **FR-19.3** | admin chat 加 slash command `/extension create` 觸發 | 0.3 |

#### FR-19.2 設計內容

**位置**: `lib/ai/agent-sdk/extension-generator.ts` (新增)

**設計**:
- **Prompt 模板**: 系統 prompt 告訴 pi agent 應生成什麼
- **Manifest schema**: Zod schema 驗證生成的 manifest.json
- **Spec schema**: Zod schema 驗證生成的 spec.json
- **Output 規範**: pi agent 透過 tool call 寫檔, 不用 raw text

**範本參考**:
- `extensions/todo/manifest.json` (manifest 範本)
- `extensions/todo/todo-spec.json` (spec 範本)

#### FR-19.3 Slash Command 觸發

**位置**: `app/admin/_components/admin-chat-panel.tsx` (修改)

**設計**:
- 偵測使用者輸入 `/extension create <name>`
- 解析為 extension generator 請求
- 把請求送到 pi agent session, 帶 extension-generator prompt
- 例如: `/extension create product --fields name,price,stock`
- 例如: `/extension create product --force` (覆寫既有)

---

### 3.3 Stage 52-2: 完整實作（FR-19.4 + FR-19.5）

| FR | 描述 | SP |
|---|---|---|
| **FR-19.4** | AI 從 prompt 生成 8 個 extension 檔案 | 0.5 |
| **FR-19.5** | 三層驗證 + 覆寫保護 | 0.4 |

#### FR-19.4 生成 8 個檔案

**生成檔案清單**（對齊 todo extension 結構）:

```
extensions/product/
├── actions/                 (1 個 action: createProduct)
├── computed/                (1 個 computed: isInStock)
├── examples/                (1 個 example: list-and-filter)
├── hooks/                   (1 個 hook: beforeCreate)
├── workflow/                (1 個 workflow: product-workflow)
├── manifest.json
├── README.md
└── product-spec.json        (CRUD spec)
```

**生成流程**:
1. Admin prompt → pi agent 收到「生成 extension」指令
2. pi agent 透過 tool call (e.g. `write_file`) 生成每個檔案
3. 每個 tool call 經過 server-side 驗證（manifest schema + spec schema）

**AI 生成的限制**:
- 只能寫入 `extensions/<name>/` 目錄（路徑防護）
- 不能修改 `extensions/todo`, `extensions/blog` 等既有 extension（除非 --force）
- 不能修改 `lib/extensions/` 等核心程式

#### FR-19.5 三層驗證 + 覆寫保護

**驗證流程**:
```
pi agent 生成所有檔案
   ↓
[1] Manifest schema 驗證（Zod）
   ↓ 通過
[2] ts/tsx 編譯驗證（tsc --noEmit）
   ↓ 通過
[3] extension-loader.test.ts 跑（確認可 load）
   ↓ 通過
回傳成功訊息給 admin
```

**覆寫保護**:
- 預設: 若 `extensions/<name>/` 已存在 → 報錯 `Extension already exists. Use --force to overwrite.`
- `--force` flag: 允許覆寫, 但需備份原 extension 到 `extensions-backup/<name>-<timestamp>/`

**位置**:
- `lib/ai/agent-sdk/extension-validator.ts` (新增)
- `tests/extension-generator-guard.test.ts` (新增)

---

## §4 守護測試計畫

### 新增守護測試（預估 +10 ~ 12 tests）

| Test | 內容 |
|---|---|
| Extension generator prompt存在 | FR-19.2 守護 |
| Manifest Zod schema 驗證 | FR-19.2 + FR-19.5 |
| Spec Zod schema 驗證 | FR-19.2 + FR-19.5 |
| Slash command `/extension create` 解析 | FR-19.3 |
| AI 生成 8 個檔案結構驗證 | FR-19.4 |
| Manifest schema 拒絕無效 manifest | FR-19.5 |
| 覆寫既有 extension 預設拒絕 | FR-19.5 |
| `--force` 允許覆寫 | FR-19.5 |
| Spike 文件存在（sprint52-ai-extension-gen.md） | FR-19.1 |

---

## §5 4 Gate SOP 執行計畫

### Stage 52-0（spike）

- **Gate 1 TDD**: 寫 spike 守護測試 (3 ~ 5 tests)
- **Gate 2 Lint+Typecheck**: 0 error
- **Gate 3 Regression**: 1989 → ~1994 tests (+5)
- **Gate 4 Reviewer**: spike 文件評估 AI 生成品質

### Stage 52-1（設計）

- **Gate 1 TDD**: 寫 generator 設計守護測試 (3 tests)
- **Gate 2 Lint+Typecheck**: 0 error
- **Gate 3 Regression**: ~1997 tests (+3)
- **Gate 4 Reviewer**: prompt 模板 + schema 設計審查

### Stage 52-2（實作）

- **Gate 1 TDD**: 寫 generator + 驗證守護測試 (5 ~ 6 tests)
- **Gate 2 Lint+Typecheck**: 0 error
- **Gate 3 Regression**: ~2003 tests (+6)
- **Gate 4 Reviewer**: 端到端測試 `/extension create product`

---

## §6 風險與緩解

| 風險 | 嚴重性 | 緩解 |
|---|---|---|
| AI 生成品質不穩定 | 🟠 高 | spike 先驗證可行性（FR-19.1） |
| 覆寫既有 extensions | 🔴 嚴重 | 預設拒絕, --force 才覆寫, 且備份（FR-19.5） |
| 生成程式碼無法編譯 | 🟠 高 | tsc 驗證（FR-19.5） |
| Manifest schema 不符 | 🟡 中 | Zod schema 驗證（FR-19.5） |
| AI 寫到 extensions/ 之外路徑 | 🔴 嚴重 | 路徑防護（只能寫入 `extensions/<name>/`）+ 守護測試 |
| 與既有 admin chat 衝突 | 🟡 中 | 僅在 slash command 觸發, 不影響一般 chat |

---

## §7 明確排除（Sprint 52 不做）

| 項目 | 排除原因 |
|---|---|
| 自動 e2e 測試（C 方案） | 範圍過大, 留 Sprint 53+ |
| Generator API 工具（C 方案） | Sprint 52 只做 admin chat 內生成, 不建獨立工具 |
| 支援其他 extension 類型 | Sprint 52 聚焦 product, 其他類型 Sprint 53+ 評估 |
| 自動 commit + push | admin 需手動確認（避免 AI 自動 push 風險） |

---

## §8 Sprint 累積表

| Sprint | FR 數 | SP | 累積 FR | 累積 SP |
|---|---|---|---|---|
| 47 | 37 | 14 | 37 | 14 |
| 48 | 15 | 4.8 | 52 | 18.8 |
| 49 | 9 | 0.8 | 61 | 19.6 |
| 50 | 4 | 0.8 | 65 | 20.4 |
| 51 | 3 | 0.8 | 68 | 21.2 |
| **52** | **5** | **2.0** | **73** | **23.2** |

---

## §9 Sprint 53+ 帶下

| 項目 | 預估 SP | 備註 |
|---|---|---|
| 自動 e2e 測試生成的 extension | 1.0 | Sprint 52-2 排除, 後續評估 |
| Generator API 工具（CLI） | 2.0 | Sprint 52-2 排除, 後續評估 |
| 支援更多 extension 類型 | TBD | 評估常見需求（inventory, invoice, etc.） |
| SourcesList v3（圖片 preview） | 1.2 | 從 Sprint 50 帶下第 5 次 |
| CRUD List 增強 | 5 | 從 Sprint 48 帶下第 4 次 |

---

## §10 Plan Gate 決策記錄

### Q1: Sprint 52 方向？

- **A. AI chat 自然語言生成完整 product extension** ← **採用**
- B. AI chat 生成最小骨架（1 SP）
- C. AI chat 生成 + 自動測試（2.5 SP）
- D. 手動建 product extension（不是 AI）

### Q2.1: 觸發模式？

- **A. slash command `/extension create`** ← **採用**
- B. 自然語言偵測（易誤觸）
- C. 後台獨立按鈕（不是 chat 流程）

### Q2.2: 生成範圍？

- **A. 完整 8 個檔案（對齊 todo）** ← **採用**
- B. 最小 3 個檔案（1 SP）
- C. 中等 5 個檔案（1.5 SP）
- D. 可配置（3 SP）

### Q2.3: 驗證方式？

- **A. 三層: loader test + manifest schema + tsc** ← **採用**
- B. 僅 manifest schema（可能 compile 失敗）
- C. loader + e2e（範圍大, 慢）
- D. 無自動驗證（品質不可控）

### Q2.4: 覆寫保護？

- **D. 預設拒絕, `--force` 才覆寫** ← **採用**
- A. 拒絕, 報錯
- B. 允許覆寫但備份
- C. 完全不檢查

---

## §11 下一步

1. ✅ Plan Gate 完成（本文件）
2. → Design Gate: 擴充 PRD §2.14 FR-19
3. Stage 52-0 spike: 驗證 AI 生成可行性
4. Stage 52-1: 設計 generator
5. Stage 52-2: 完整實作 + 驗證 + 守護測試
6. Submit Gate: reflection + backlog

---

**Plan Gate 結束時間**: 2026-09-01
**Sprint 52 commits**: 3（預估）
**Sprint 52 SP**: 2.0（預估）
**下一個 gate**: Sprint 52 Design Gate