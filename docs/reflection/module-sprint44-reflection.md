# Sprint 44 Reflection — Admin AI Chat FAB + Reflection 清理

**Sprint**: 44
**期間**: 2025-08-30 ~ 2025-08-31
**規模**: 17 SP（合併做）
**完成度**: 100%

---

## 1. Sprint 目標

| 階段 | 目標 | 結果 |
|---|---|---|
| 第一階段（§4.x）| Sprint 43 reflection 揭露的 5 項改進 | ✅ 完成（Commit A/B/C）|
| 第二階段 | Admin AI Chat FAB 功能 | ✅ 完成（Commit D-H）|

---

## 2. 完成的 Commits

| Commit | 範圍 | SP | Hash |
|---|---|---|---|
| A | §4.2 placeholder data migration | 2 | `2236d6c` |
| B | §4.1 AI_ENCRYPTION_KEY 部署檢查 | 1 | `0f96018` |
| C | §4.6 SOP 改進 + CONTRIBUTING.md | 1 | `2343de3` |
| D | AdminFab + 拖動 + snap 邏輯 | 2 | `2a900b0` |
| E | Chat Drawer UI + streaming + markdown | 3 | `6ff96be` |
| F | `/api/admin/chat` + createProviderFromDB | 3 | `337e567` |
| G1 | ChatSession/ChatMessage schema index | 1 | `80c97b8` |
| G2 | Sessions CRUD + 兩欄 Drawer UI | 2 | `ddc89e5` |
| H | E2E 守護 | 2 | (本次 commit) |

---

## 3. 第一階段（§4.x Reflection 清理）執行總結

### 3.1 Commit A（§4.2 placeholder data migration）
- 發現：dev DB 1 筆資料實證是合法 AES-GCM（3 段 hex），但仍建 migration 作為 defensive coding
- 教訓：守護測試要對應「行為」，不能只對應「source code pattern」

### 3.2 Commit B（§4.1 AI_ENCRYPTION_KEY 部署檢查）
- 三層驗證：存在 / 格式（hex chars）/ 業務規則（64 chars = 32 bytes）
- 警告文案直接寫進 README.md，讓部署者第一眼看到風險

### 3.3 Commit C（§4.6 SOP 改進 + CONTRIBUTING.md）
- 流程文件比技術改動更重要
- CONTRIBUTING.md 涵蓋 4 Gate SOP + commit template + 7 項 checklist + AI Agent 指引
- `validate` script + `precommit` hook

---

## 4. 第二階段（Admin AI Chat FAB）執行總結

### 4.1 架構決策

| 決策 | 選擇 | 理由 |
|---|---|---|
| FAB 拖動 snap | C：鬆手自動 snap 到離螢幕邊緣最近 | 用戶期待的自由度 + 自動整理 |
| Chat 範圍 | 跟 `/chat` 共用 ChatMessage type | 減少維護成本 |
| AI Provider | createProviderFromDB | 自動套用 Custom URL 設定 |
| 對話範圍 | 每個 admin 自己的 sessions | 隱私 + 隔離 |
| MVP 範圍 | 純文字對話框（input + list）| Sprint 44 SP 限制 |

### 4.2 互動流程
1. 點 FAB（右下角浮動按鈕）→ 開右側 Drawer
2. Drawer 兩欄：
   - 左 240px 歷史對話 sidebar（含「新開對話」button + 歷史 list + 刪除 button）
   - 右 chat 內容（input + message list + streaming indicator）
3. 點「歷史對話」button → toggle 左 sidebar 顯示/隱藏
4. ESC 或 backdrop 點擊 → 關閉 drawer

### 4.3 「pi agent」真實意圖重新理解
- 用戶在 Plan Gate 提到「用 pi agent SDK」
- 實查：`@earendil-works/pi-coding-agent` **沒有公開 npm package**
- 實際意義：「用 Sprint 43 provider factory + SSE streaming」機制
- 最終：`createProviderFromDB` + 自製 SSE stream route
- **不破壞 Sprint 43 Custom URL 功能**

### 4.4 AI SDK Elements 評估
- 用戶在 Commit G 後提出 https://elements.ai-sdk.dev/examples/chatbot 參考
- 評估後決定：放 Sprint 45 規劃
- 原因：AI SDK Elements 預設用 Vercel AI Gateway，會破壞 Custom URL 支援
- 需要新一輪 Plan Gate 設計整合方式

---

## 5. 技術細節

### 5.1 拖動 + Snap 邏輯（Commit D）
```typescript
export function snapToEdge(x, y, viewportWidth, viewportHeight, fabSize = 56) {
  const xSnapped = x < viewportWidth / 2 ? 0 : viewportWidth - fabSize;
  const ySnapped = y < viewportHeight / 2 ? 0 : viewportHeight - fabSize;
  return { x: xSnapped, y: ySnapped };
}
```
- 純函數 + 8 個單元測試
- 拖動 > 3px 才算拖，避免誤觸 click
- onPointerDown/Move/Up 用 React PointerEvent（統一 mouse + touch）

### 5.2 兩欄 Drawer（Commit E + G2）
- 寬度 700px（240px sidebar + 460px chat），max-w-[100vw] 適配 mobile
- header 固定頂部 shrink-0，內部可滾動
- 兩欄用 flex + border-r 分隔

### 5.3 SSE 串流（Commit F）
- fetch + ReadableStream reader（SSE parsing）
- `data: { content }` chunks
- `data: [DONE]` 結尾訊號
- 錯誤用 `data: { error }` chunk，不 throw

### 5.4 Schema 索引（Commit G1）
- `[userId, updatedAt DESC]` 給歷史對話列表排序
- `[sessionId, createdAt]` 給 session 內訊息排序
- 既有 ChatSession/ChatMessage 已存在（M2 section），只加索引

### 5.5 持久化（Commit F + G2）
- stream route 接受 sessionId
- user message 串流前寫入 DB
- assistant 完整回應串流後寫入 + 更新 session.updatedAt
- 沒 sessionId 時不持久化（向後相容）

---

## 6. Sprint 揭露的教訓

### 6.1 「用 pi agent」需明確認定實際範圍
- 模糊詞彙會誤導設計
- 應該追問：「具體是哪個 npm package？什麼 API？」
- 實查後才能給出可行方案

### 6.2 「用盡右邊 Drawer」優於「浮動對話框」
- 用戶中期回饋觸發 UI 重新設計
- Drawer 不擋 admin 主要內容（table / form）
- 兩欄 layout 對 admin 工具更實用

### 6.3 「歷史對話」+「新開對話」buttons 的整合時機
- 原本 Commit G 只規劃 schema
- 用戶需求變動後擴展為完整 UI（兩欄 + buttons + CRUD）
- 反映出：**DB schema 跟 UI 整合要一起做才有效**

### 6.4 ChatSession / ChatMessage schema 已存在
- Sprint 早期（M2）已建好
- 不需重複新增，只加索引即可
- 教訓：先 grep schema 確認現況

### 6.5 既有 Prisma migration 自動產生 timestamp prefix
- 測試不能寫死日期
- 改驗 schema 內容（`@@index(...)` pattern）

---

## 7. 測試演進

| 階段 | 測試總數 |
|---|---|
| Sprint 43 Submit | 1519 |
| Bug Fixes（#1-#5） | 1519 |
| Sprint 44 A | 1523 |
| Sprint 44 B | 1530 |
| Sprint 44 C | 1535 |
| Sprint 44 D | 1552（+17 FAB + snap）|
| Sprint 44 E | 1561（+9 dialog + panel）|
| Sprint 44 F | 1570（+8 admin chat API）|
| Sprint 44 G1 | 1577（+7 schema index）|
| Sprint 44 G2 | 1587（+10 sessions CRUD + UI）|
| Sprint 44 H | 1587 + 7 E2E |

---

## 8. Sprint 45 待辦（從這次揭露）

1. **AI SDK Elements 整合評估**
   - 用戶提供 https://elements.ai-sdk.dev/examples/chatbot 參考
   - 需決定：取代自製 chat UI / 僅前端元件 / 不整合
   - 預估 SP：5-8（如要做）

2. **Chat 功能擴展**
   - File attachments（S44 prompt input 沒支援）
   - Markdown 程式碼高亮（自製 renderMarkdown 太簡）
   - Reasoning display（AI SDK Elements 內建）

3. **Sources / Web Search**
   - 用戶沒明確要求，但 AI SDK Elements 有
   - 評估是否需要

---

## 9. Sprint 44 SOP §4.x 改進驗證

| §4.x 改進 | 落地狀態 |
|---|---|
| §4.1 部署檢查 | ✅ Commit B + README + .env.example |
| §4.2 placeholder migration | ✅ Commit A + 守護測試 |
| §4.3 encryption key rotation（未做）| ⏳ Sprint 45+ |
| §4.4 schema change 雙軌驗證（未做）| ⏳ Sprint 45+ |
| §4.5 file pattern vs e2e（部分）| ✅ Commit H 補 e2e |
| §4.6 SOP 改進 | ✅ Commit C + CONTRIBUTING.md + validate script |

---

## 10. 結論

Sprint 44 成功交付：
- **第一階段**：4 項 reflection 改進落地（5 SP → 4 SP 實際）
- **第二階段**：Admin AI Chat FAB 完整功能（12 SP 預估 → 13 SP 實際）
- **總計**：17 SP / 17 SP = **100%**

關鍵成功因素：
- Plan Gate 先決定方向，避免實作時返工
- 用戶中期回饋（UI 改為 Drawer + 兩欄 + buttons）被快速整合
- Sprint 43 已建立的 provider factory + ChatSession schema 大幅降低實作成本
- E2E 守護驗證真實 UI 行為

關鍵風險：
- 「pi agent SDK」模糊詞彙 → 實查後重新定義範圍
- AI SDK Elements 整合 → 需 Sprint 45 規劃
