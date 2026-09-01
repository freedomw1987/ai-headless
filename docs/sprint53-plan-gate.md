# Sprint 53 Plan Gate — 整合 admin chat + 端到端生成 product extension

> **日期**: 2026-09-01
> **Sprint**: Sprint 53
> **狀態**: ✅ Plan Gate 完成
> **決策**: **整合 admin chat + 攔截 + 端到端生成 product** (3 SP, 4 commits)
> **方向**: **延續 Sprint 52 新方向** — 將 AI 生成 extensions 從「設計階段」推到「runtime 整合」
> **範圍**: 4 FR / 3 SP / 4 commits

---

## §1 為什麼是 Sprint 53？

**Sprint 52 reflection §5 + §8 帶下項目**:
> 「Sprint 52-2 runtime 整合 (留 Sprint 53+)」
> 「admin-chat-panel.tsx 整合 slash command 處理」
> 「連接 pi agent session 帶 EXTENSION_GENERATOR_SYSTEM_PROMPT」
> 「server-side 攔截 tool call 呼叫 validator」
> 「三層驗證最後把關」

**Sprint 52 完成的事**:
- ✅ Spike 可行性驗證
- ✅ Extension Generator (Zod schema + prompt + slash command)
- ✅ Extension Validator (路徑防護 + 覆寫保護 + 三層驗證)

**Sprint 53 應完成的事**:
- ❌ → ✅ admin chat 整合 slash command 偵測
- ❌ → ✅ server-side 攔截 pi agent tool call, 呼叫 validator
- ❌ → ✅ 端到端: admin 輸入 → AI 生成 → 驗證 → extensions/product/ 8 個檔案

---

## §2 決策彙總（5 個 Q&A）

| 決策 | 採用 | SP |
|---|---|---|
| 方向 | 整合 admin chat + 攔截 + 端到端生成 product | 3.0 |
| 產物 | 完整 8 個檔案 (對齊 Sprint 52 spike) | 0.5 |
| AI 模型 | 沿用 admin chat AI config (Sprint 46+) | 0 |
| 生成流程 | 同步 (輸入 → 生成 → 驗證 → 回傳) | 0 |
| 錯誤處理 | 回傳明確錯誤訊息 (哪一層失敗) | 0 |

---

## §3 Sprint 53 FR 拆解（4 FR / 3 SP / 4 commits）

### 3.1 Stage 53-0: admin chat 整合 slash command（FR-20.1）

| FR | 描述 | SP |
|---|---|---|
| **FR-20.1** | admin-chat-panel 整合 slash command 偵測 `/extension create` | 0.5 |

**位置**: `app/admin/_components/admin-chat-panel.tsx` (修改)

**設計**:
- 在現有 input handler 中偵測 `/extension` 開頭
- 呼叫 `parseExtensionCommand(input)` 解析
- 若為 `create` action, 觸發 extension generator flow (不再走一般 chat)
- 若為 `help` action, 回傳用法說明
- 若為非 extension command, 走一般 chat flow

**與 Sprint 46-2 admin chat 整合**:
- 沿用 `use-chat-sessions.ts` 的 session 機制
- 不開新 session, 使用現有 session 即可
- 在 chat 訊息中標記「[Extension Generator]」標籤

---

### 3.2 Stage 53-1: server-side 攔截 + validator 整合（FR-20.2 + FR-20.4）

| FR | 描述 | SP |
|---|---|---|
| **FR-20.2** | server-side 攔截 pi agent tool call, 呼叫 validator | 0.5 |
| **FR-20.4** | 三層驗證整合: loader test + manifest schema + tsc 編譯 | 0.5 |

**位置**: `lib/ai/agent-sdk/agent-sdk.ts` (修改) + `app/api/admin/chat/stream/route.ts` (修改)

**設計**:
- pi agent 透過 `write_file(path, content)` tool call 寫檔
- Server-side 攔截 write_file tool call:
  1. 檢查 `isPathAllowed(path, extensionName)`
  2. 若拒絕, 回傳錯誤給 AI (不寫入)
- 全部寫入完成後:
  1. 跑 `validateExtensionFiles(files, extensionName)`
  2. 失敗 → 全部回滾 (刪除已寫入的檔案)
  3. 成功 → 回傳 success 訊息給 admin

**三層驗證**:
- **Layer 1 (Schema)**: Zod spec + manifest schema (Sprint 52-2 已實作)
- **Layer 2 (結構)**: 8 個檔案必須齊全 (Sprint 52-2 已實作)
- **Layer 3 (編譯)**: tsc --noEmit 對生成的檔案執行編譯檢查 (Sprint 53 新增)

**tsc 編譯驗證**:
- 用 Node.js child process 執行 `npx tsc --noEmit extensions/<name>/**/*`
- 若失敗, 回傳錯誤訊息給 admin
- 若成功, extension 已可運作

---

### 3.3 Stage 53-2: 端到端生成 product（FR-20.3）

| FR | 描述 | SP |
|---|---|---|
| **FR-20.3** | 端到端: admin 輸入 → AI 生成 → 驗證 → extensions/product/ 8 個檔案 | 1.5 |

**設計**:

**輸入格式**:
```
/extension create product --fields=name,price,stock
```

**端到端流程**:
```
1. Admin 輸入 /extension create product --fields=name,price,stock
2. admin-chat-panel 偵測 slash command, 觸發 extension generator
3. Server-side 建立 pi agent session 帶 EXTENSION_GENERATOR_SYSTEM_PROMPT
4. AI 透過 write_file tool call 寫入 8 個檔案
5. Server-side 攔截每個 tool call, 驗證 path + content
6. 全部寫入後, 跑三層驗證 (schema + 結構 + tsc)
7. 驗證失敗 → 回滾 + 回傳錯誤訊息
8. 驗證成功 → 回傳 success 訊息 + extension 路徑
```

**生成的 8 個檔案** (對齊 Sprint 52 spike §7):
```
extensions/product/
├── actions/complete.ts           (1 個 action)
├── computed/isInStock.ts         (1 個 computed)
├── examples/list-and-filter.ts   (1 個 example)
├── hooks/beforeCreate.ts         (1 個 hook)
├── workflow/product-workflow.ts  (1 個 workflow)
├── manifest.json
├── README.md
└── product-spec.json             (CRUD spec)
```

**守護測試** (預估 +8 ~ 10 tests):
- FR-20.1: slash command 偵測在 admin-chat-panel
- FR-20.2: write_file tool call 攔截 + path 防護
- FR-20.3: 端到端生成 product (需真實 AI 模型, 留 spike)
- FR-20.4: tsc 編譯驗證 + 回滾機制

---

## §4 守護測試計畫

### 新增守護測試（預估 +10 ~ 12 tests）

| Test | 內容 |
|---|---|
| FR-20.1.1 | admin-chat-panel.tsx 包含 slash command 偵測 |
| FR-20.1.2 | parseExtensionCommand 整合 (來自 Sprint 52-1) |
| FR-20.2.1 | write_file 攔截邏輯存在 |
| FR-20.2.2 | 路徑違規時拒絕 tool call |
| FR-20.2.3 | 全部寫入後呼叫 validateExtensionFiles |
| FR-20.3.1 | 端到端 spike 測試 (留 manual, 需真實 AI) |
| FR-20.3.2 | mock AI 生成 8 個檔案, 驗證寫入流程 |
| FR-20.4.1 | tsc 編譯驗證函式存在 |
| FR-20.4.2 | 驗證失敗回滾機制 |

---

## §5 4 Gate SOP 執行計畫

### Stage 53-0 (FR-20.1)

- **Gate 1 TDD**: 寫 slash command 偵測守護測試 (3 tests)
- **Gate 2 Lint+Typecheck**: 0 error
- **Gate 3 Regression**: 2041 → ~2044 tests (+3)
- **Gate 4 Reviewer**: slash command 整合不影響一般 chat

### Stage 53-1 (FR-20.2 + FR-20.4)

- **Gate 1 TDD**: 寫攔截 + 驗證守護測試 (5 tests)
- **Gate 2 Lint+Typecheck**: 0 error
- **Gate 3 Regression**: ~2049 tests (+5)
- **Gate 4 Reviewer**: 攔截邏輯嚴謹, 路徑防護有效

### Stage 53-2 (FR-20.3)

- **Gate 1 TDD**: 寫端到端守護測試 + mock AI (4 tests)
- **Gate 2 Lint+Typecheck**: 0 error
- **Gate 3 Regression**: ~2053 tests (+4)
- **Gate 4 Reviewer**: 端到端 spike (manual)

---

## §6 風險與緩解

| 風險 | 嚴重性 | 緩解 |
|---|---|---|
| pi agent tool call 不易攔截 | 🟠 高 | 用 agent-sdk 提供 callback hook 設計 |
| AI 生成 8 個檔案品質不穩定 | 🟠 中 | 已有 Sprint 52 Zod schema + validator |
| tsc 編譯驗證耗時 | 🟡 中 | 僅驗證生成的 extension 目錄, 不全專案 |
| 端到端測試不穩定 (需真實 AI) | 🟠 高 | 守護測試為主 (mock AI), 端到端手動驗證 |
| Token cost 高 | 🟡 中 | 預估 5-10k tokens/extension, 可接受 |
| 已生成的 extensions/product/ 影響測試 | 🟢 低 | 守護測試用 `--force` 備份到 extensions-backup/ |

---

## §7 明確排除（Sprint 53 不做）

| 項目 | 排除原因 |
|---|---|
| 自動 e2e 測試 (Playwright) | Sprint 52 排除, 留 Sprint 54+ |
| Generator CLI 工具 | Sprint 52 排除, 留 Sprint 55+ |
| 支援更多 extension 類型 | Sprint 53 只生成 product, 其他類型 Sprint 56+ 評估 |
| 自動 commit + push | admin 需手動確認 (避免 AI 自動 push 風險) |
| 非同步生成流程 (SSE 進度) | 同步流程已足夠, 非同步留 Sprint 57+ |

---

## §8 Sprint 累積表

| Sprint | FR 數 | SP | 累積 FR | 累積 SP |
|---|---|---|---|---|
| 47 | 37 | 14 | 37 | 14 |
| 48 | 15 | 4.8 | 52 | 18.8 |
| 49 | 9 | 0.8 | 61 | 19.6 |
| 50 | 4 | 0.8 | 65 | 20.4 |
| 51 | 3 | 0.8 | 68 | 21.2 |
| 52 | 5 | 2.0 | 73 | 23.2 |
| **53** | **4** | **3.0** | **77** | **26.2** |

---

## §9 Sprint 54+ 帶下

| 項目 | 預估 SP | 備註 |
|---|---|---|
| 自動 e2e 測試生成的 extension | 1.0 | Sprint 53 排除, 評估 Playwright |
| Generator CLI 工具 | 2.0 | Sprint 53 排除, 後續評估 |
| 支援更多 extension 類型 (inventory, invoice 等) | TBD | 評估常見需求 |
| 非同步生成流程 (SSE 進度) | 1.5 | 同步流程已足夠, 非同步留後續 |
| SourcesList v3（圖片 preview） | 1.2 | 從 Sprint 50 帶下第 6 次 |
| CRUD List 增強 | 5 | 從 Sprint 48 帶下第 5 次 |

---

## §10 Plan Gate 決策記錄

### Q1: Sprint 53 方向？

- **A. 整合 admin chat + 攔截 + 端到端生成 product** ← **採用**
- B. 整合 admin chat + 攔截 (留 e2e Sprint 54) (2 SP)
- C. 攔截 + 三層驗證 + 守護測試 (留 UI) (1.5 SP)
- D. 最小可行 (整合 + 攔截 + 守護測試) (1 SP)

### Q2.1: 實際生成產物？

- **A. 完整 8 個檔案** ← **採用**
- B. 5 個檔案 (2 SP)
- C. 3 個檔案 (1.5 SP)

### Q2.2: AI 模型？

- **A. 沿用 admin chat AI config** ← **採用**
- B. 預設 GPT-4o (需額外配置)
- C. 預設 Claude 3.5 Sonnet (需額外配置)
- D. Admin 自行選擇 (增加 UI 複雜度)

### Q2.3: 生成流程？

- **A. 同步流程 (輸入 → 生成 → 驗證 → 回傳)** ← **採用**
- B. 非同步流程 (SSE 進度) (複雜)
- C. 預覽流程 (AI 生成後 admin 確認) (增加 UI 步驟)

### Q2.4: 錯誤處理？

- **A. 回傳明確錯誤訊息 (哪一層失敗)** ← **採用**
- B. 自動重試 3 次 (增加 token cost)
- C. 部分寫入 (危險)
- D. 全部拒絕 + 詳細 log (回應時間長)

---

## §11 下一步

1. ✅ Plan Gate 完成（本文件）
2. → Design Gate: 擴充 PRD §2.15 FR-20
3. Stage 53-0: admin chat 整合 slash command 偵測
4. Stage 53-1: server-side 攔截 + validator 整合
5. Stage 53-2: 端到端生成 + 守護測試
6. Submit Gate: reflection + backlog

---

**Plan Gate 結束時間**: 2026-09-01
**Sprint 53 commits**: 4 (預估)
**Sprint 53 SP**: 3.0 (預估)
**下一個 gate**: Sprint 53 Design Gate