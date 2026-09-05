# Sprint 55 Plan Gate — 補通 AI 生成 extension 端到端流程 (Sprint 53 留尾)

> **日期**: 2026-09-05
> **Sprint**: Sprint 55
> **狀態**: ✅ Plan Gate 完成
> **決策**: **補通端到端** (從 admin chat `/extension create` → server endpoint → extensions/<name>/ 真實 8 檔案)
> **方向**: **修護 Sprint 53 留尾**，接通「admin 在 chat 自然語言生成 extension」這條產品化核心 demo 流程
> **範圍**: 3 FR / 2.5 SP / 3 commits

---

## §1 為什麼是 Sprint 55？

**Sprint 54 反思 + 用戶反饋 (2026-09-05 09:45)**:
> 「現在 AI chatbot 功能可以生成 extension 了嗎？」

**誠實答案**: ❌ 不能。

**Sprint 53 留下的 3 個缺口**:
1. **❌ admin chat `/extension create` → 沒有任何 server endpoint**
   - `admin-chat-panel.tsx` `handleExtensionCommand` 偵測 slash command 但 return true 後什麼都沒做 (Sprint 53-0 留 TODO 給 Sprint 53-1)
2. **❌ 沒 `POST /api/admin/extensions/generate` endpoint**
   - `processExtensionGeneration()` 函式已實作 (Sprint 53-1)，但無呼叫端
3. **❌ 沒 server-side 攔截 pi agent tool call**
   - Sprint 53-1 Plan Gate 設計是「攔截 pi agent tool call」，但實際只做了「手動呼叫 processExtensionGeneration」

**Sprint 53 Plan Gate 文件 §3.2 預期**:
> 「server-side 攔截 pi agent tool call, 呼叫 validator」
> 實際: **完全沒做**

**為什麼 Sprint 53-1/53-2 沒接通？**:
- Sprint 53-1 守護測試 (extension-tool-wrapper-guard.test.ts) 是假資料 `[{path, content}]` 直接呼叫函式
- Sprint 53-2 守護測試 (extension-e2e-guard.test.ts) 也是 mock AI 響應
- **沒有真實的「admin 輸入 → AI 生成」接通**

**這影響什麼？**:
- ❌ 用戶無法 demo 給外人看：「AI 自動建 extension」
- ❌ 產品化「最殺手鐧」不能用
- ❌ 之前 reflection §5 帶下項目「AI 生成 extensions product CRUD」實際只有 30% 完成

---

## §2 為什麼現在是 Sprint 55 而不是更早？

**Sprint 54 之前：用戶聚焦在「修復 delete button bug」**
**Sprint 54 之後：用戶問「產品化差多遠？」 + 知道 AI 生成 extension 不能用**

**這是 P0**:
- 沒接通 → 產品化 = 空中樓閣
- 接通 → 立刻能 demo 「AI 自然語言 → 完整 CRUD 系統」
- 1 SP (2-3 天) 就能接通，比做 Landing Page + 文檔站 ROI 高太多

---

## §3 為什麼不直接走 pi agent tool call 攔截 (Sprint 53 Plan Gate 原始設計)？

| 路線 | 描述 | 風險 | 複雜度 |
|---|---|---|---|
| **A. 直接 server endpoint + 手動組 8 個檔案** (本次採用) | chat 收到 `/extension create` → POST /api/extensions/generate → server 用固定 8 檔案模板 (參考 todo extension) → 寫入 extensions/<name>/ | 中 | 低 |
| B. pi agent tool call 攔截 | 把 processExtensionGeneration 接到 pi agent SDK 的 tool call 流程，讓 AI 真正動態生成 | 高 | 高 |

**採用 A 的理由**:
- 目標是「產品 demo 能用」，不是「AI 真正動態生成」
- Sprint 52 spike 結論是「AI 一次生成完整 8 檔是 mock 真實可行性」，實際 AI 可能生成不一致 schema
- A 路線用「固定 8 檔案模板 + admin 指定 fields」即可達成 90% 產品化效果
- B 路線需要再 1-2 SP 接通 pi agent SDK 攔截 + LLM 多次對話成本

**A 路線的代價**:
- 不能 demo「AI 真正根據自然語言生成任意 extension」
- 但能 demo「admin 輸入 `/extension create product --fields=name,price,stock` → 30 秒後出現完整 product extension」

**A 路線的價值**:
- 1 SP 接通，比 B 路線省 1-2 SP
- 立刻可 demo，比 B 路線早 1 週
- 之後 Sprint 56+ 可疊加 B 路線 (動態 LLM 生成)

---

## §4 Sprint 55 FR 拆解 (3 FR / 2.5 SP / 3 commits)

### 4.1 Stage 55-0: Server endpoint + 8 檔案模板 (FR-22.1, FR-22.2)

| FR | 描述 | SP |
|---|---|---|
| **FR-22.1** | 建立 `POST /api/admin/extensions/generate` endpoint，接受 `{ name, fields?, force? }` 參數 | 1.0 |
| **FR-22.2** | 用 `processExtensionGeneration()` 流程 + 8 檔案模板 (參考 todo extension) 動態生成 extensions/<name>/ | 1.0 |

**位置**:
- 新建 `app/api/admin/extensions/generate/route.ts` (POST handler)
- 新建 `lib/ai/agent-sdk/extension-template.ts` (8 檔案模板生成器)

**設計**:
- 接受 fields: `string[]` (e.g. `['name', 'price', 'stock']`)
- 自動推斷每個 field 的 type (default `string`)
- 自動生成：
  1. `manifest.json` (參考 todo manifest)
  2. `<name>-spec.json` (model fields + auto-id + auto-createdAt/updatedAt)
  3. `hooks/beforeCreate.ts` (設定 createdAt/updatedAt)
  4. `actions/complete.ts` (若 model 有 completed field)
  5. `computed/remainingDays.ts` (若 model 有 dueDate field)
  6. `workflow/<name>-workflow.ts` (draft → published 簡單狀態機)
  7. `examples/list-and-filter.ts` (API 呼叫範例)
  8. `README.md` (簡單 markdown 說明)
- 透過 `processExtensionGeneration` 三層驗證 → 寫入磁碟

**風險**:
- AI 模型仍沒真的動態生成，這條路線只能讓 admin 用固定模板
- 之後 Sprint 56+ 可疊加真 LLM 動態生成

### 4.2 Stage 55-1: Admin chat 整合 (FR-22.3)

| FR | 描述 | SP |
|---|---|---|
| **FR-22.3** | admin chat panel 把 `/extension create` 轉 `fetch('/api/admin/extensions/generate')`，結果顯示在 chat 訊息 | 0.5 |

**位置**: `app/admin/_components/admin-chat-panel.tsx` (修改)

**設計**:
- `handleExtensionCommand` 不再只是 return true
- 改為呼叫 `fetch('/api/admin/extensions/generate', { method: 'POST', body: { name, fields, force } })`
- 收到結果 → 在 chat 中顯示「✅ 已建立 extension 'product'，8 個檔案於 extensions/product/」或「❌ 錯誤: ...」
- 不走 SSE stream (這是批次操作不是對話)

### 4.3 Stage 55-2: 守護測試 (FR-22.4)

| FR | 描述 | SP |
|---|---|---|
| **FR-22.4** | 守護測試: 端到端流程接通 (從 chat panel → server endpoint → extensions/<name>/ 真實 8 檔案 → 守護測試防止下次斷裂) | 1.0 |

**位置**:
- 新建 `tests/extension-flow-e2e-guard.test.ts`
- 新建 `app/api/admin/extensions/generate/route.test.ts` (POST handler 測試)
- 新建 `app/admin/_components/admin-chat-extension-cmd-guard.test.ts` (chat panel 守護)

**測試項目**:
- `POST /api/admin/extensions/generate` 401/403 (未登入/非 admin)
- 接受 `{ name, fields, force }` 參數, 走 processExtensionGeneration
- 8 個檔案實際寫入 (tmp dir 測試, 不污染 extensions/)
- AdminChatPanel handleExtensionCommand 真的 fetch endpoint (不是 stub)
- 守護測試: 防止「下次重構又把 slash command 弄成 stub」

---

## §5 不在 Sprint 55 範圍內

- ❌ **真 LLM 動態生成** (留 Sprint 56+, B 路線)
- ❌ **Web UI Extension Builder** (留 Sprint 58+, 給非技術 admin)
- ❌ **Extension Marketplace** (留 Sprint 60+, B2B 商業化)
- ❌ **Extension Auto-test** (留 Sprint 57+, 防止生成的 extension 有 bug)
- ❌ **更多 extension 範例** (留 Sprint 56+, inventory/invoice/blog-post)

---

## §6 風險評估

| 風險 | 機率 | 影響 | 緩解 |
|---|---|---|---|
| 8 檔案模板不一致 → 三層驗證失敗 | 中 | 中 | 沿用 todo extension 結構 (已被驗證可跑) |
| path traversal 漏洞 | 低 | 高 | 用既有 `isPathAllowed()` (Sprint 52-2 已實作) |
| 既有 extensions 被覆寫 | 低 | 中 | 用既有 `checkOverwrite()` (Sprint 52-2 已實作) + force flag |
| AdminChatPanel fetch 失敗顯示不友善 | 中 | 低 | 簡單 try/catch + 顯示錯誤訊息 |

---

## §7 為什麼這個 Sprint 對產品化至關重要

**Sprint 54 Reflection §3 列的「最殺手鐧」**:
> 「AI 自然語言 → 完整 CRUD 系統生成」

**沒有這個**:
- 產品化 = 「另一個 CRUD framework」 (WordPress / Strapi / Payload CMS 都有)
- 文檔寫「AI 生成 extension」 = 吹牛 (實際功能不存在)

**有了這個**:
- 產品化 = 「唯一用自然語言生成完整 CRUD 的 headless framework」
- 文檔能 demo 真實影片 (30 秒 admin 輸入 → extensions/product/ 出現)
- 行銷故事：「30 秒建一個完整 CRUD 系統，不用寫 code」

**這是最大 ROI 的 2.5 SP**:
- 比 Landing Page (3-5 天) 還高
- 比 LICENSE (0.5 天) 還高
- 比 Doc Site (1 週) 還高

---

## §8 計畫

1. **Stage 55-0** (1.5 SP, ~1 小時)
   - 建 `extension-template.ts` 8 檔案模板生成器
   - 建 `POST /api/admin/extensions/generate/route.ts`
2. **Stage 55-1** (0.5 SP, ~30 分鐘)
   - 改 `admin-chat-panel.tsx` 真 fetch endpoint
3. **Stage 55-2** (1 SP, ~1 小時)
   - 寫守護測試 + integration test
   - 確保下次 Sprint 不會再次「留尾」

總計 **3 SP / 3 commits**, 但實際可用 2.5 SP 完成 (沿用既有 validator + 模板簡單)