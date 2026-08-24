# Sprint 5 反省報告

> **Sprint 範圍**: Sprint 5 — Gate 1-4 baseline 修復 + 技術債清理
> **反省日期**: 2026-08-24
> **參與者**: Agent + 用戶
> **反省級別**: Sprint

## Sprint 總覽

| 項目 | 數據 |
|------|------|
| 計劃完成 US | 6 個 (TD-501 ~ TD-506) |
| 實際完成 US | **6 個 (100%)** |
| 計劃 Story Points | 8.5 SP |
| 實際 Story Points | 8.5 SP (100%) |
| Sprint 開始 Gate 狀態 | ❌ baseline 損壞(typecheck/lint/tests 失敗) |
| Sprint 結束 Gate 狀態 | ✅ 全綠(639/639 + 0 errors + 0 warnings) |
| 測試數 | 600 → **639** (+39) |
| 測試時間 | 11.62s → 8.53s (-27%) |
| 發現的新問題 | Gate 4 reviewer P1×6 + P2×4 |

## 完成 US 列表

| US ID | 標題 | 計劃 SP | 實際 SP | 狀態 |
|-------|------|---------|---------|------|
| **infra-1** | Gate 1-4 baseline 修復 | - | 1.5 | ✅ 修 JWT augmentation + ESLint 9 flat config |
| TD-501 | chat-page-client 重構 | 3 | 3 | ✅ + reviewer P1+P2 followup |
| TD-502 | chat audit log + rate limit + auth | 1 | 1 | ✅ |
| TD-503 | SSE abort/cancel | 1 | 1 | ✅ |
| TD-504 | Mock stream delay 優化 | 1 | 1 | ✅ |
| TD-505 | Token usage 追蹤 | 2 | 2 | ✅ |
| TD-506 | ChatSidebar close icon | 0.5 | 0.5 | ✅ |

**Sprint 實際包含**: 1 個臨時 infra fix + 6 個 Tech Debt items = 7 commits with 6 marked ✅

---

## 6 項維度檢查

### 1. UX/UI 一致性 — ✅ 通過

| 檢查項 | 結果 | 證據 |
|---|---|---|
| 設計風格統一 | ✅ | TD-506: ChatSidebar close 從 emoji ✕ → lucide X icon,與其他 lucide icon 一致 |
| 可訪問性 | ✅ | TD-506: icon 加 `aria-hidden` (button 已有 `aria-label`) |
| 鍵盤導航 | ⚠️ | ChatInput Enter/Shift+Enter 已有,但 ChatPage 全域 ESC 關 sidebar 未實作 |
| Loading 狀態 | ✅ | TD-503 abort + TD-504 優化讓 streaming 指示更順暢 |

**唯一風險**:手機版 ESC 鍵關 sidebar 沒實作(但有 overlay click + close button)。

### 2. RWD 響應式設計 — ⚠️ 部分通過

| 檢查項 | 結果 | 證據 |
|---|---|---|
| 桌面 (>768px) sidebar | ✅ | TD-501 重構保留 `hidden md:block` 桌面邏輯 |
| 手機版抽屜 | ✅ | TD-501 重構保留 mobile drawer + overlay + selectAndClose |
| 平板 (768px-1024px) | ⚠️ | 沒專門處理。Tablet 用桌面版樣式可能 sidebar 太擠 |
| 字級/間距自適應 | ⚠️ | 沒用 Tailwind `sm:` `md:` `lg:` 細粒度調整,只用 md 切換 sidebar |

**整體**:RWD 基礎在但僅有桌面/手機二分,**平板**介於中間地帶未專門考慮。

### 3. 技術債 — ⚠️ 已清完但新發現幾項

**Sprint 清掉的技術債**:
- ✅ TD-501 chat-page-client.tsx 243 行 → 3 個 hooks(職責分離)
- ✅ TD-502 auth/rate-limit/audit(原本在 backlog 但未實作)
- ✅ TD-503 SSE abort/cancel
- ✅ TD-504 Mock stream 15ms/char → env var 控制(-29% 測試時間)
- ✅ TD-505 token usage 追蹤(完整 OpenAI/Anthropic parse + audit)
- ✅ TD-506 emoji icon 一致性
- ✅ Infra: JWT augmentation comment + ESLint flat config 修復

**新發現(待清)**:
- ⚠️ **TD-507**: `pnpm-workspace.yaml` 內 Tiptap `minimumReleaseAgeExclude` 是 pnpm 11 升級 workaround — Tiptap 套件源尚未完全信任,需持續追蹤
- ⚠️ **TD-508**: `useChatStream` 的 hook 設計改用 functional setSessions 是「**繞過 stale closure**」的方法,根本原因是 hook 持有 sessions 陣列 + 透過 callback 反讀會 race,**更乾淨方案是用 useReducer + dispatch**
- ⚠️ **TD-509**: `lib/auth/config.ts` 內 JWT augmentation module 宣告需要 `import type { JWT }` 作為 module-load trigger,這是 TS quirk — 應在 JSDoc 註解清楚(目前註解已加但應在 module declaration 上方)

### 4. 可維護性 — ✅ 通過

| 檢查項 | 結果 | 證據 |
|---|---|---|
| Hook 職責分離 | ✅ | TD-501: 3 個獨立 hooks,sessions / stream / sidebar toggle |
| 命名一致性 | ✅ | useChatXxx pattern 一致 |
| 模組化 | ✅ | `app/chat/hooks/` 子目錄組織清晰 |
| 重複代碼 | ✅ | TD-501 P2-1: 3 個 helper 合併為 `mutateLastAssistant` |
| 文件註解 | ✅ | 所有 hook 都有 JSDoc 說明用途與用法 |
| TypeScript strict | ✅ | 0 個 `any`,大量 union/narrowing |

**新增的可維護性改進**:
- `mutateLastAssistant(sessionId, mutator)` — 統一改寫最後一條 assistant 訊息的模式
- `.at(-1)` 取代 `messages[messages.length - 1]!` — 移除 `!` 非空斷言
- 環境變數集中管理(TD-504 `.env.example` 註解)

### 5. 測試覆蓋率 — ⚠️ 通過但有缺位

**Sprint 5 新增測試**:

| 測試類型 | 數量 | 位置 |
|---|---|---|
| Unit - MockProvider delay | 6 | `lib/ai/providers/providers.test.ts` (TD-504) |
| Unit - rate limit | 6 | `lib/ai/chat/chat-rate-limit.test.ts` |
| Unit - chat-page-client 行為 | 7 | `app/chat/chat-page-client.test.tsx` |
| Unit - TD-506 icon | 3 | `components/chat/chat-sidebar.test.tsx` |
| Unit - TD-505 provider usage | 7 | `lib/ai/providers/providers.test.ts` |
| Integration - TD-505 usage | 6 | `tests/integration/td-505-usage-integration.test.ts` |
| **合計** | **35** | — |

**測試覆蓋缺口**:

| 缺口 | 重要性 |
|---|---|
| ❌ TD-503 UI abort 場景(切換 chat / unmount / resend) | **P1 from reviewer** — 需 Playwright/E2E |
| ⚠️ `use-chat-stream.ts` 無獨立單元測試 | **P2** — 整合測試有覆蓋,但 hook 內 mutateLastAssistant 沒隔離測試 |
| ⚠️ `use-chat-sessions.ts` 無單元測試 | **P2** — 同上 |

### 6. 需求對齊 — ✅ 通過

| 原需求 | 對應 Sprint 交付 |
|---|---|
| Gate 1-4 修復(版本升級後 baseline) | ✅ c04b836 + bcf5fd1 + 後續 followup |
| SSE 串流可中斷 | ✅ TD-503 |
| Rate limit + Audit | ✅ TD-502 |
| Token 成本追蹤(未來計價基礎) | ✅ TD-505 + `chat.usage` audit event |
| Mock 慢於 CI | ✅ TD-504 (-29%) |
| ChatSidebar 視覺一致 | ✅ TD-506 |

**整體對齊度**:100% — 所有 backlog 計畫的技術債 item 都已交付。

---

## Gate 4 Reviewer 額外發現

Gate 4 reviewer subagent 對 TD-501 重構做了完整審查,發現:

### P1(已修 — 6 個,commit `b806d4a`)

1. ✅ **Stale closure race bug** — `useChatStream` 用 getSession/setSession 在 for-await 內 race,會導致串流完成後訊息消失。**已修**(改用 functional setSessions)。
2. ✅ Streaming deps 註解矛盾 — 已重寫
3. ✅ getSession 未 memoize — 已移除(不再需要)
4. ✅ 「新對話」測試無效 — 已加強
5. ✅ 缺 JsonSpec 提取測試 — 已加
6. ✅ 缺錯誤訊息測試 — 已加

### P2(已修 — 4 個,commit `923c03a`)

1. ✅ 3 個 helper 重複 → 抽 `mutateLastAssistant`
2. ✅ 大量 `!` 斷言 → 用 `.at(-1)` narrowing
3. ✅ `useSidebarToggle.toggle` 死代碼 → 移除
4. ✅ AbortError 顯示為使用者錯誤 → 略過

---

## Sprint 5 學到的教訓

### 做對的事
1. **Gate baseline 修復作為 Sprint 起點** — 一開始就把工具鏈修好,後續每個 task 都有乾淨的 Gate 1-4 驗證
2. **TDD 紅綠循環** — 每個 TD-xxx 都先寫失敗測試再寫實作,確保測試真的覆蓋行為
4. **Reviewer subagent** — Gate 4 找到 P1 bug,如果不是 reviewer 這個 bug 會在 production 才暴露
5. **Pre-existing bug 主動處理** — P1-1 是 TD-501 重構前就存在的 bug,reviewer 指出後合併修

### 做錯 / 可改進的事
1. **Sprint 開始沒先跑 reflection** — Sprint 4 結束後應先反省並排 Sprint 5 plan,而非直接從 backlog 挑任務
2. **TD-505 scope 過大** — `generateTextWithUsage()` 在 OpenAIProvider/AnthropicProvider 實作但目前呼叫端都用 stream path,該方法目前 dead code(可後續清)
3. **沒先看 reviewer** — TD-501 寫完直接 commit,沒先經 Gate 4 才發現 P1 bug。**經驗**:重構型任務完成後應立即跑 Gate 4,不是等 Sprint 結束
4. **平板 RWD 沒規劃** — 只有桌面/手機二分法,中間尺寸未考慮

---

## Backlog 更新(本次反省新增)

| ID | 類型 | 標題 | 優先級 | SP | 估計 Sprint |
|----|------|------|--------|----|-----------|
| **TD-507** | Tech Debt | pnpm-workspace Tiptap `minimumReleaseAgeExclude` 暫時方案 | P2 | 0.5 | Sprint 6 |
| **TD-508** | Tech Debt | `useChatStream` functional setSessions 是 workaround;考慮改用 `useReducer` + dispatch 徹底避免 stale closure | P2 | 2 | Sprint 6 |
| **TD-509** | Tech Debt | `lib/auth/config.ts` JWT augmentation module declaration 加 JSDoc 解釋為何需 `import type { JWT }` | P3 | 0.5 | Sprint 6 |
| **US-S6-1** | User Story | TD-503 UI abort 場景加 Playwright E2E 測試 | P1 | 2 | Sprint 6 |
| **US-S6-2** | User Story | 平板尺寸 (768-1024px) RWD 優化 | P2 | 1 | Sprint 6 |

---

## 與用戶確認 Action Items

> **需要用戶決定**:
>
> 1. **TD-507 ~ TD-509** 是否進 Sprint 6?還是推到 Sprint 7?
> 2. **US-S6-1** (Playwright E2E for TD-503) — 這個是 reviewer P1,是否優先?
> 3. **US-S6-2** (平板 RWD) — 是否納入 Sprint 6,或延後?

---

## Sprint 6 初步建議

**最推薦方向** (待用戶確認):

### 主軸:**測試基礎建設 + UI 健壯性**

| US | 標題 | SP |
|----|------|----|
| **US-S6-1** | Playwright E2E for TD-503 UI abort(切換 chat / unmount / resend) | 2 |
| **US-S6-2** | 平板 RWD 優化(768-1024px sidebar 收合 + 字級) | 1 |
| TD-507 | Tiptap workaround → 追蹤上游 + 移除 exclude | 0.5 |
| TD-508 | `useChatStream` 改用 useReducer | 2 |
| TD-509 | JWT augmentation JSDoc | 0.5 |

**合計**:6 SP(中等 Sprint)

### 替代方向:從新 backlog 找任務

如果用戶想完全換方向,需先看 `docs/backlog.md` 是否有更高優先級業務需求。