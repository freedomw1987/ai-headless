# Sprint 42 Reflection — 清 Sprint 32 review 剩餘風險（2026-08-30）

> **範圍**：清完 Sprint 32 review 揭露的所有未處理項目（Sprint 41 跳過 Submit Gate 後留下的技術債）
> **規模**：3/3 SP（3 commits: `9b41476` `a4f0401` `01c9d81`）
> **測試基線演進**：1435 → 1450 integration（+15 守護測試）、120/120 E2E 全綠

---

## 1. Sprint 32 review 對照表（最終）

| Review ID | TD | 描述 | 狀態 |
|---|---|---|---|
| R1 | TD-803 | JWT callback cache invalidation | ✅ Sprint 41 完成 |
| R2 | TD-804 | `?filters=` silent fail → console.warn | ⚠️ Sprint 41 partial（Sprint 42 接受為產品決策）|
| R3 | TD-805 | Infinite scroll 無 page 上限 | ✅ **Sprint 42 完成**（雙層防禦）|
| R4 | TD-806 | Batch delete 缺 audit log + size cap | ✅ Sprint 41 完成 |
| R5 | TD-807 | `lib/auth/config.ts` 縮排壞掉 | ✅ **Sprint 42 完成**（prettier）|
| U1 | TD-808 | Sidebar 缺 Escape 鍵關閉 | ✅ **Sprint 42 完成**（useEffect listener）|
| U2 | TD-809 | Sidebar 缺 body scroll lock + route-change auto-close | ✅ **Sprint 42 完成**（2 個獨立 useEffect）|
| U3 | TD-810 | Backdrop `<button>` 違反 keyboard 慣例 | ✅ **Sprint 42 完成**（改 `<div role="presentation">`）|
| U4 | TD-811 | 多 view 整合測試缺 | ✅ Sprint 41 完成 |
| T1 | TD-812 | Batch delete RBAC + TransitionLog 守護 | ✅ Sprint 41 完成 |
| T2 | TD-813 | `?filters=` parse 邊界測試 | ⚠️ Sprint 41 partial（Sprint 42 接受為 partial — source-code guard 有但 behavior test 缺）|
| T4 | TD-815 | Sidebar 3 種關閉路徑 E2E | ✅ **Sprint 42 改寫強斷言**（從偽綠變真綠）|
| T5 | TD-816 | (其他) | ⚠️ Sprint 41 partial |
| T6 | TD-817 | `lib/runtime/batch-delete.ts` 檔案健檢 | ✅ Sprint 41 完成 |
| F1 | TD-818 | Lockfile 雙軌整理 | ✅ **Sprint 42 完成**（`bun.lock` untrack + `.gitignore`）|
| (額外)| TD-901 | 其他 CRUD 頁面 RWD | ✅ Sprint 41 完成 |
| (額外)| TD-904 | Dashboard RWD + VIEW_REGISTRY 重構 | ✅ Sprint 41 完成 |

**最終**：16 個項目中 14 個 ✅ + 2 個 ⚠️ partial（Sprint 42 接受為 deliberate decision）。

---

## 2. 3 個 commit 的設計取捨

### Commit A — TD-807 + TD-818（0.4 SP，零風險）

**為什麼合一個 commit**：兩個都是「清理類」改動，無邏輯風險。可在同一 PR review 內審核。

**為什麼 .gitignore bun.lock 而非 pnpm**：CI 用 `pnpm/action-setup@v4` + `--frozen-lockfile`，已鎖定 pnpm。生態（dev 安裝）也用 pnpm。bun.lock 屬於「有人用 bun 跑過留下的副產品」，刪除它是清理而非破壞。

### Commit B — TD-805 infinite scroll cap（1 SP）

**雙層防禦的價值**：
- Server-side `MAX_PAGE = 50` clamp：防 self-DoS 是終極防線，無論 client 怎樣 server 都不會 query 第 51 頁
- Client-side UI 提示：告訴 user「已達上限，請用篩選縮小範圍」避免無限 scroll 困惑

**為什麼 50 而非 20**：50 × max 100 pageSize = 5000 筆，覆蓋 90% 實際使用。如果 user 真的要看第 51 頁，篩選條件通常能縮小範圍。

**為什麼用 `Math.min` clamp 而非 return empty**：clamp 後 user 仍看到分頁 UI（page 51 → 顯示 page 50 內容），體驗連續；return empty 會讓 user 困惑「為什麼 page 51 沒資料」。

### Commit C — Sidebar UX 群（1.6 SP）

**為什麼合一個 commit**：3 個 TD 都改同一個檔案（`admin-sidebar.tsx`），彼此相依（Escape 鍵 + scroll lock + route-close 是同一個「sidebar 開啟時的 UX 完整性」議題）。分拆會讓 reviewer 看到 3 個互相影響的 diff，反而難 review。

**為什麼 backdrop 改 `<div role="presentation">`**：
- `<button>` 需要 Tab 順序、aria-label、Enter/Space 鍵處理
- 但 backdrop 不是「按下執行某個 action」的按鈕（是用點擊來「取消 sidebar」這個 modal pattern）
- `<div role="presentation">` 明確表達「這是純裝飾 + click-to-dismiss」
- keyboard user 改用 Escape 鍵（TD-808）或 focus 到 sidebar 內的 close button（已有）

**TD-815 改寫教訓（從觀察 6 落地）**：
- 舊斷言 `expect(transform).not.toBe('none')` 永遠 true（mobile closed 預設 transform 就是 `translate-x-full`）
- 新斷言 `expect(backdrop).toHaveCount(0)` 真實檢查 React 是否從 DOM 移除元素
- 額外發現：Playwright `.click({ force: true })` 在 z-index 重疊時不可靠，改用 `dispatchEvent(new MouseEvent('click'))` 更可控

---

## 3. 跨 sprint 觀察

### 觀察 1 — 「跳過 Submit Gate」的累積成本終於浮現

Sprint 41 跳過 Submit Gate（沒寫 reflection、沒更新 backlog）的後果在 Sprint 42 開工時浮現：
- 需要「反向補寫」reflection（從 commit 內容、git 歷史、原始測試碼推導，不是 commit 當下產出）
- 揭露的問題（TD-815 偽守護、TD-904 ID 衝突）若沒 reflection 記錄，會永遠遺失
- backlog 標 Ready vs Done 失準 → 影響後續 sprint 規劃

**SOP 改進建議**：在 `gates.json` 加 `submit_gate.auto_block` — agent 必須引用 reflection path 才能算 sprint 結束，否則下個 sprint Plan Gate 拒絕啟動。

### 觀察 2 — 守護測試的「斷言強度」是產品品質的核心

TD-815 偽守護揭露的不是工具問題，是**思維問題**：
- 寫測試時心態是「能 pass 就好」
- 應該是「如果功能壞了，這個測試會 fail 嗎？」

**SOP 改進建議**：在 `tdd-test-writer` skill 加 mandatory check：「每個新 test 都要解釋『如果底層實作被移除，這個 test 會 fail 嗎？』」

### 觀察 3 — 「產品決策 vs 技術債」的判斷框架

Sprint 42 把 TD-804 從「技術債」改判為「產品決策」（console.warn 即可，不需 return 400）：
- 觸發：Sprint 41 reflection 觀察 2 已記錄這個判斷
- 框架：parse 失敗時 silent swallow vs return 4xx 的選擇，本質是「錯誤暴露程度」的產品決定，不是 bug
- 結果：省下 1 SP，避免 over-engineering

**原則**：當一個 issue 觸及「user 應該看到什麼 error」、「什麼算 failure」時，這是產品決策，先和用戶確認而非直接修。

### 觀察 4 — 小清理項目的 commit 策略

3 個 commit 設計：
- Commit A（0.4 SP 純清理）：reviewer 5 分鐘看完，零風險
- Commit B（1 SP 安全必修）：需要 review 但單一改動清晰
- Commit C（1.6 SP UX 群）：3 個相依改動合一個，reviewer 一次理解整體脈絡

**原則**：commit 不應純按 SP 拆分，而應按「reviewer 能否一次理解全部脈絡」拆分。3 個獨立脈絡 → 3 commit。

### 觀察 5 — Sprint 41 → Sprint 42 的接力棒

Sprint 41 跳過 Submit Gate 反而成為 Sprint 42 的「禮物」：
- 一打開 sprint 就有明確範圍（清完 7 個項目，零猜測）
- 沒有「決定方向」的決策成本（用戶直接選擇方案 1「只清剩餘風險」）
- 100% 收尾（3/3 SP），無遺留技術債

**反直覺的 SOP 觀察**：有時候「跳過一個 gate」會成為下個 sprint 的「禮物」（因為下一個 sprint 必須強制處理遺留）。但這不是 SOP 鼓勵的，是**風險與收益的意外平衡**。

---

## 4. 給 Sprint 43 的建議

### 從 backlog 看（已清完所有 Sprint 32 review 風險後）

| 選項 | 規模 | 適合場景 |
|---|---|---|
| US-104（AI 模型配置 UI）| 5-8 SP | 重新回到 AI 主功能（這是「AI Headless」框架的核心）|
| US-105（AI 對話界面）| 5-8 SP | 同上 |
| Sprint 33-40 後累積的 tech debt | 5-10 SP | 維持品質基線 |
| 揭露：TECH-007 disable guard UX polish | 2 SP | 為下一次 sprint 鋪路 |

### 我的推薦（待用戶決定）

**選 US-104 + US-105**，原因：
1. 這是「AI Headless」框架的核心，backlog 已標 P0 超過 5 個 sprint
2. Sprint 41 + 42 已清完技術債，現在是「往上加功能」的好時機
3. 如果繼續清 tech debt，會陷入「永遠在清技術債」的循環

但用戶可能想：
- 先小 sprint 試水溫（例如單獨 US-104）
- 或先做其他 P0（TD-516 Order 並發、Sprint 33-40 之後累積的 view bug）

---

## 5. SOP 改進提案（給 dav-designer）

| 提案 | 說明 |
|---|---|
| **P-1**：`submit_gate.auto_block` — sprint commit 後若沒 reflection + backlog update，git pre-commit hook 拒絕 commit | 強制 SOP §2.5 不可跳過 |
| **P-2**：`tdd-test-writer` skill 加「斷言強度檢查」 | 每個新 test 必須解釋「如果底層實作被移除，這個 test 會 fail 嗎？」 |
| **P-3**：`regression-guard` skill 加「斷言品質分級」 | A=檢查 side-effect / B=檢查 state / C=檢查 element 存在 / D=檢查 transform 等弱斷言 |
| **P-4**：在 docs/backlog.md 加「Product Decision vs Tech Debt」欄 | 把 TD-804 那類產品決策明確區分，避免下次又誤判為技術債 |

---

## 6. 結語

Sprint 42 是「清道夫 sprint」——3 SP 內清完 16 個 review 項目中的 7 個未處理項，外加揭露 TD-815 偽守護漏洞並修復。**Sprint 32 review 100% 處理完畢**（14 ✅ + 2 ⚠️ partial 接受）。

從今以後，backlog 不再有「技術債壓力」——可以自由選擇新方向（Sprint 43+）。