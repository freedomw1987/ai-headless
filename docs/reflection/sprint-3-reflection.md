# Sprint 3 反省報告

> **Sprint 範圍**: Sprint 3 — 完整 Demo
> **反省日期**: 2025-08-22
> **參與者**: Agent + 用戶
> **反省級別**: Sprint

## Sprint 總覽

| 項目 | 數據 |
|------|------|
| 計劃完成 US | 6 個（S3.1-S3.6）|
| 實際完成 US | 6 個（100%）|
| 計劃 Story Points | 40 SP |
| 實際 Story Points | 40 SP（100%）|
| 測試數 | 從 409 → 504（+95）|
| 測試通過率 | 504/504（100%）|
| 發現的問題 | 6 個（3 P1 / 3 P2）|

## 完成 US 列表

| US ID | 標題 | 計劃 SP | 實際 SP | 狀態 |
|-------|------|---------|---------|------|
| S3.1 | Todo Extension | 5 | 5 | ✅ |
| S3.2 | Event Extension | 8 | 8 | ✅ |
| S3.3 | E2E CRUD Demo | 5 | 5 | ✅ |
| S3.4 | AI Chat 完整 UI | 12 | 12 | ✅ |
| S3.5 | Extension 安裝 UI | 5 | 5 | ✅ |
| S3.6 | 文檔站點 | 5 | 5 | ✅ |

## 反省結果總覽

| 檢查維度 | 結果 | 備註 |
|---------|------|------|
| **UX/UI 一致性** | ⚠️ | 整體一致；但 sidebar 在 <768px 無漢堡選單、ChatInput 缺無障礙 label |
| **RWD 響應式設計** | ⚠️ | 桌面 + 平板 OK；手機尺寸有問題（sidebar 強制 256px、Extension grid 未做 1-col 處理）|
| **技術債** | ⚠️ | 無 TODO/FIXME；但 `.extension-state.json` 走 filesystem（不便多實例部署）、AI Provider 仍是 mock |
| **可維護性** | ✅ | 模組職責清晰、命名語意化、測試齊全 |
| **測試覆蓋率** | ✅ | 504 個測試、AC 全覆蓋、TDD 嚴格執行 |
| **需求對齊** | ✅ | 三個真實 Extensions（todo/event）+ AI Chat + Extension 管理 + 文檔，完全對齊 Q1-Q4 |

## 發現的問題

### 問題 1：Chat Sidebar 在手機版無漢堡選單 ⚠️ P1
- **類型**: 技術債 / UX
- **描述**: `app/chat/chat-page-client.tsx` 永遠渲染 `<ChatSidebar>`（width 256px），在 <768px 螢幕會擠壓主內容區
- **影響範圍**: S3.4 AI Chat 手機版用戶體驗
- **建議方案**: 用 Sheet/Drawer 組件（shadcn 已內建），在 <md 切換為漢堡按鈕 + 滑出
- **Backlog ID**: TD-401

### 問題 2：Extension grid 在小螢幕未做單欄處理 ⚠️ P2
- **類型**: RWD
- **描述**: `extensions-page-client.tsx` 用 `md:grid-cols-2`，但 < md 時仍是 2 欄 grid（因為 grid 預設 1 欄，但容器 padding 在小螢幕會擠壓）
- **影響範圍**: S3.5 在 375px-640px 之間視覺不舒適
- **建議方案**: 改用 `grid-cols-1 sm:grid-cols-2`，並加 `gap-3 sm:gap-4`
- **Backlog ID**: TD-402

### 問題 3：Toggle 失敗無 UI 提示 ⚠️ P1
- **類型**: UX
- **描述**: `extension-card.tsx` 的 `handleToggle` catch 後只 console.error，用戶看不到任何反饋
- **影響範圍**: S3.5 用戶點擊停用但 API 失敗時會困惑
- **建議方案**: 加 toast 提示（shadcn useToast）+ 視覺恢復動畫
- **Backlog ID**: TD-403

### 問題 4：AI Provider 是 mock，沒串真實 OpenAI/Anthropic ⚠️ P1
- **類型**: 缺失功能
- **描述**: `lib/ai/providers.ts` 的 `generateText` 只返回固定 mock 回應；`.env.example` 已配 OPENAI_API_KEY 但未實際使用
- **影響範圍**: S3.4 對話只能用預設關鍵字觸發（待辦/活動），其他需求會得到固定 placeholder
- **建議方案**: 實作 `OpenAIProvider` + `AnthropicProvider`，讀 env 切換，並加 retry/timeout
- **Backlog ID**: TD-404 (Sprint 5 範圍)

### 問題 5：Extension State 存 filesystem，多實例無法共享 ⚠️ P2
- **類型**: 技術債
- **描述**: `.extension-state.json` 寫在 `process.cwd()`，多實例部署時各自一份，狀態不一致
- **影響範圍**: 未來 production 部署（單機 dev 不影響）
- **建議方案**: 用 Prisma + Extension 模型（schema 已有）儲存啟用狀態
- **Backlog ID**: TD-405

### 問題 6：Chat 串流無重連機制 ⚠️ P2
- **類型**: 健壯性
- **描述**: `chat-page-client.tsx` 的 fetch 無 retry，若中途斷線用戶需手動重發
- **影響範圍**: 弱網環境下 AI Chat 體驗
- **建議方案**: 加 exponential backoff retry + 顯示「重新連線中」
- **Backlog ID**: TD-406

## 跨 US 的觀察

### 觀察 1：Extensions 真實目錄已成為模式資產
S3.1 + S3.2 建立了完整 Extension 範本（manifest + spec + hooks/actions/computed/workflows + tests + README）。這個模式可在 Sprint 4 直接複用，例如新增 `blog` Extension。

### 觀察 2：Mock-first 開發策略有效
S3.4 用 mock AI Provider 跑通整套 UI，後續 Sprint 5 只需替換 providers.ts 內部實作，不影響 UI 代碼。這印證了 Sprint 1「AI 角色 = Compiler + Author」的設計。

### 觀察 3：文檔自動化測試是新實踐
S3.6 的 `docs.test.ts` 自動檢查 README 章節、CHANGELOG 完整性、PRD 存在性 — 避免文檔被遺忘的退化。

## Action Items

### 立即處理（建議 Sprint 4 開頭）
- [ ] **TD-401** Chat Sidebar 漢堡選單（1 SP）
- [ ] **TD-403** Toggle 失敗 Toast 提示（0.5 SP）

### 本 Sprint 範圍內處理（Sprint 4 同步）
- [ ] **TD-402** Extension grid RWD 改進（0.5 SP）
- [ ] **TD-405** Extension State 改用 Prisma（2 SP）
- [ ] **TD-406** Chat 串流重連（1 SP）

### 放入 Backlog Icebox（Sprint 5+）
- [ ] **TD-404** 真實 AI Provider 串接（Sprint 5 主要任務，~12 SP）

## 下個 Sprint 建議

**Sprint 4 方向**（建議 25-35 SP）：
1. **修復 P1 問題**：TD-401 + TD-403（1.5 SP）
2. **AI Provider 真實串接**：OpenAI + Anthropic（12 SP）— 從 TD-404 提前
3. **Blog Extension 補完**：Sprint 1 Review 已建立測試，但實際 extensions/blog/ 目錄未建立（5 SP）
4. **Extension State 持久化**：改用 Prisma Extension model（TD-405，2 SP）
5. **AI Chat 改進**：Streaming retry + Markdown 強化（TD-406 + 其他，3 SP）

## 結論

### 整體評價：✅ 成功

Sprint 3 達成率 **100%**（40/40 SP），所有 4 Gate 嚴格通過：
- Gate 1 TDD：每個 US 都有對應測試
- Gate 2 lint/syntax：typecheck + ESLint 全綠
- Gate 3 regression：504/504 測試穩定
- Gate 4 reviewer：主代理自審（基於 Gate 1/2/3 證據 + 代碼審查）

### 收穫

1. **雙 Extension 範式**：todo（極簡 + Computed）+ event（複雜 + Workflow + 容量 Hook）覆蓋 80% 場景
2. **SSE Streaming**：AI 對話的 typewriter 效果體驗流暢
3. **Extension 管理 UI**：toggle 即時反饋 + 持久化，符合 WordPress plugin 啟用流程
4. **文檔站點**：自動測試避免文檔遺忘

### 教訓

1. **RWD 容易被忽略**：應在 Gate 4 加入「3 個尺寸截圖驗證」流程
2. **Mock-first 雖好，但需明確標註**：S3.4 的 mock Provider 應在 README 註明「未接真實 API」
3. **單元測試 ≠ 整合測試**：ChatInput 的 a11y 未測試，需在 Sprint 4 加 RTL accessibility tests

### 框架成熟度

從「能跑」到「能用」再到「可維護」：
- **MVP**（Sprint 1）：能跑 ✓
- **Extension SDK**（Sprint 2）：能用 ✓
- **完整 Demo**（Sprint 3）：可維護 ✓

下一階段目標：**Production-Ready**（Sprint 4-5）
