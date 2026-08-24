# Sprint 4 反省報告

> **Sprint 範圍**: Sprint 4 — AI Pipeline 完整化 + 立即修復
> **反省日期**: 2025-08-24
> **參與者**: Agent + 用戶
> **反省級別**: Sprint

## Sprint 總覽

| 項目 | 數據 |
|------|------|
| 計劃完成 US | 5 個（S4.1-S4.5）|
| 實際完成 US | 4 個（80%）|
| 計劃 Story Points | 22 SP |
| 實際 Story Points | 17 SP（77%）|
| 略過 US | S4.3（TD-405 Extension State 持久化）|
| 測試數 | 從 504 → 566（+62）|
| 測試通過率 | 566/566（100%）|
| 發現的新問題 | 6 個（4 P1 + 2 P2）|

## 完成 US 列表

| US ID | 標題 | 計劃 SP | 實際 SP | 狀態 |
|-------|------|---------|---------|------|
| S4.1 | 立即修復（TD-401 ChatSidebar + TD-403 Toast）| 1.5 | 1.5 | ✅ |
| S4.2 | RWD + Retry（TD-402 + TD-406）| 1.5 | 1.5 | ✅ |
| S4.3 | Extension State Prisma（TD-405）| 2 | 0 | ⏭️ 略過 |
| S4.4 | AI Provider 真實串接（TD-404）| 12 | 12 | ✅ |
| S4.5 | Blog Extension 補完 | 5 | 5 | ✅ |

## 反省結果總覽

| 檢查維度 | 結果 | 備註 |
|---------|------|------|
| **UX/UI 一致性** | ⚠️→✅ | 修復了 ChatSidebar、Extension grid RWD、加入 Toast 反饋。但 ChatSidebar 抽屜式 sidebar 的關閉圖示用純文字「✕」（非 icon）+ 漢堡按鈕用「☰」（無 aria-label 文字版本）|
| **RWD 響應式設計** | ⚠️→✅ | 三種尺寸都通過：桌面 sidebar 永久顯示，手機漢堡 + 抽屜，Extension grid <sm 自動單欄 |
| **技術債** | ⚠️ | **略過 TD-405 是最大遺留**；另有 5 個新發現技術債（見下）|
| **可維護性** | ✅ | 模組職責清晰：providers.ts / stream-client.ts / toast.tsx / chat-sidebar.tsx 各自獨立 |
| **測試覆蓋率** | ✅ | 566 個測試、AC 全覆蓋、TDD 嚴格執行（先紅後綠）|
| **需求對齊** | ✅ | 修復了 Sprint 3 Review 的 5 個 TD（Sprint 3 提出 6 個，5 個完成，1 個略過）+ 補完 Blog Extension（混合模式完整展示）|

## 發現的問題

### 問題 1：TD-405 Extension State 未遷移至 Prisma ⏭️ P2
- **類型**: 技術債
- **描述**: `lib/extensions/extension-manager.ts` 用 `.extension-state.json` filesystem 持久化，但 Prisma 已有 `Extension` model（schema.prisma 定義完整）。多實例部署會 race condition。
- **影響範圍**: Docker/K8s 多實例部署場景
- **建議方案**: 把 filesystem 改為 Prisma CRUD，~1-2 小時工作量
- **Backlog ID**: TD-405（保留，繼續往 Sprint 5 推）

### 問題 2：chat-page-client.tsx 221 行，職責略多 ⚠️ P2
- **類型**: 技術債 / 可維護性
- **描述**: `app/chat/chat-page-client.tsx` 同時負責：UI 渲染（sidebar + messages + input）、串流邏輯、session 管理、RWD 切換邏輯、retry 處理
- **影響範圍**: 未來修改 chat page 任一行為需讀 221 行
- **建議方案**: 抽出 `useChatStream` hook（封裝 streamChatWithRetry + state 管理）+ 抽出 `ChatLayout` 組件（封裝 RWD）
- **Backlog ID**: TD-501

### 問題 3：OpenAI/Anthropic API Key 缺乏 server-side 驗證 ⚠️ P1
- **類型**: 安全 / 技術債
- **描述**: `/api/chat/stream` 直接讀 `process.env.OPENAI_API_KEY`，沒有檢查該用戶是否有權限呼叫 AI、未做 rate limit、未審計日誌
- **影響範圍**: 公開部署後任何人可消耗 API key
- **建議方案**:
  1. 檢查 Auth.js session（如未登入 → 401）
  2. 加簡單 rate limit（IP 或 user 維度，每分鐘 20 次）
  3. 加呼叫日誌（model、tokens、cost）
- **Backlog ID**: TD-502

### 問題 4：SSE streaming 沒有 abort/cancel 機制 ⚠️ P2
- **類型**: 技術債 / UX
- **描述**: 用戶點擊新對話或離開頁面時，正在進行的 SSE 串流沒有被中斷，會繼續消耗 API quota
- **影響範圍**: AI Provider API 成本 + 用戶體驗
- **建議方案**: 用 AbortController，組件 unmount 時 abort fetch
- **Backlog ID**: TD-503

### 問題 5：Mock Stream 字符級延遲 15ms 造成測試慢 ⚠️ P2
- **類型**: 技術債 / 測試
- **描述**: `MockProvider.streamText` 每字符延遲 15ms，600 字符 = 9 秒。整合測試 `ai-provider-switching.test.ts` 設了 30s timeout 才能跑完，影響 CI 時間
- **影響範圍**: CI/CD 速度
- **建議方案**: Mock 用「句子/詞級」延遲而非字符級，或加 `MOCK_STREAM_DELAY_MS` env 讓測試時設 0
- **Backlog ID**: TD-504

### 問題 6：AI Provider 缺少 token 使用量追蹤 ⚠️ P2
- **類型**: 缺失功能
- **描述**: OpenAI/Anthropic 回應含 `usage` 字段（prompt_tokens / completion_tokens），目前完全丟棄
- **影響範圍**: 無法計算成本、debug 無法知道為何某次回應特別長
- **建議方案**: 在 streamText 結束後收集 usage，寫入日誌或 DB
- **Backlog ID**: TD-505

### 問題 7：ChatSidebar close 按鈕用 emoji「✕」而非 icon ⚠️ P3
- **類型**: UX
- **描述**: 純文字 emoji 在某些字體下表現不一致，且無 aria-label 文字版
- **影響範圍**: 視覺一致性 + 無障礙
- **建議方案**: 用 lucide-react 的 X icon（已有 `@radix-ui` 相關依賴）
- **Backlog ID**: TD-506

## 跨 US 的觀察

1. **Sprint 4 真正展示了「混合模式」端到端能力**：自然語言 → 真實 OpenAI/Anthropic → JsonSpec → Blog Extension。這是框架核心殺手鐗的完整 demo。

2. **「修復類」任務（S4.1+S4.2）小而重要**：1.5 SP + 1.5 SP = 3 SP 解決了 4 個用戶體驗問題。Sprint 5 應該繼續保留這個模式。

3. **略過 S4.3 是真實 trade-off**：不是技術問題，是時程問題。如果未來要部署到 K8s，必須補做。

4. **AI Provider 模組化很好**：抽象介面 + 工廠函式 + 4 種實作，未來加 Google Gemini / Azure OpenAI 只要 < 100 行。

5. **測試覆蓋率持續上升**：504 → 566（+62）。但 Mock 慢速問題（TD-504）會影響 CI。

## Action Items

### 立即處理（Sprint 5 開頭必須做）
- [ ] **TD-502** AI API 安全驗證 + rate limit（1 SP，P1）
- [ ] **TD-405** Extension State 改用 Prisma（2 SP，P2 — 用戶確認補做）

### 本 Sprint 內（Sprint 5 計劃內）
- [ ] **TD-501** 抽出 useChatStream hook（3 SP，P2）
- [ ] **TD-503** SSE abort 機制（1 SP，P2）
- [ ] **TD-505** Token 使用量追蹤（2 SP，P2）

### 放入 Backlog Icebox（不緊急）
- [ ] **TD-504** Mock stream 加速（1 SP，P2）
- [ ] **TD-506** ChatSidebar 用 lucide icon（0.5 SP，P3）

## 下個 Sprint 建議

**Sprint 5 建議方向**（候選）：
1. **完成 Sprint 4 遺留**：TD-405 + TD-502（安全）+ TD-503（3 SP 必要修復）
2. **Demos & Onboarding**：從零開始的真實「用戶故事 → 系統」demo 影片或教學
3. **真實部署**：Docker compose + README 部署指南 + 首頁 onboarding wizard
4. **RBAC 強化**：Auth.js v5 已有基礎，加 permissions matrix UI

**最推薦方向**：**完成 Sprint 4 遺留（TD-405 + TD-502 + TD-503）**，原因是 Sprint 4 已展示核心能力，Sprint 5 應先把「遺留技術債 + 安全」收尾，再進入新功能。

## 結論

Sprint 4 **整體成功**，雖然略過 TD-405 但核心價值（AI 真實串接 + Blog Extension 混合模式）完整交付。17/22 SP 的完成度在「高技術風險任務佔 12 SP」的前提下是可接受的。

**收穫**：
- 證明了 JsonSpec + Extension 系統可與真實 LLM（OpenAI + Anthropic）整合
- 建立了 Provider 抽象，工廠模式讓切換 AI 模型零成本
- Blog Extension 是第一個「用戶可視的」完整混合模式範例
- 4 個 P1 修復全部完成，用戶體驗明顯改善

**教訓**：
- 22 SP 對 Sprint 4 略高，應該拆成 18 SP + 5 SP（兩個 Sprint）
- TD-405 應該在 Sprint 3 就一起做（filesystem 持久化是已知的長期問題）
- 缺 server-side 驗證是 P1 安全風險，不該等到 Sprint 5

**Sprint 5 決策點**：
1. 繼續做修復類任務（TD-405 + TD-502 + TD-503）
2. 進入新功能（Onboarding wizard、Demo videos）
3. 混合策略（先 3 SP 修復，再 8 SP 新功能）

建議跟用戶確認 Sprint 5 方向。