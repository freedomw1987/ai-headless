# Sprint 32 Review — 後續追蹤清單（2026-08-30）

> **來源**：Sprint 32 收尾後（2026-08-30）對 working tree 的 code review
> **範圍**：Sprint 32 交付 + working tree 未提交變更（涵蓋 Sprint A/B3/C/D + 29-3 + TD-802）
> **狀態**：📋 追蹤中（16 個 TD 開立，見 [docs/backlog.md §📊 Backlog 主表](../backlog.md#-backlog-主表單一表按優先級排序)）
> **對應 Sprint**：下個 sprint（Sprint 30+ 待 Plan Gate 決定方向時，先修 P1 必修）

---

## 🎯 為什麼要這份 review

Sprint 32 reflection（[`sprint-32.md`](sprint-32.md)）記錄的是「已 commit 的 4 SP RWD 工作」，**沒有涵蓋**當前 working tree 中 50+ 個未提交的變更。這些變更包括：

- Sprint A 收尾（infinite scroll）
- Sprint B3 補完（batch delete）
- Sprint C（column toggle）
- Sprint D（advanced filter）
- Sprint 29-3 + TD-802（avatar/name 即時生效）

這些都是 Sprint 27 / 28-29 已 ✅ Done 的功能延伸，但 code review 發現 5 個 correctness 風險、3 個 UX 缺口、6 個 missing tests。

---

## 📊 Review 結論總覽

| 類別 | 數量 | 必修 |
|------|------|------|
| **Correctness risks** | 5 | R1, R2, R3, R4, R5 |
| **UX regressions** | 3 | U1, U2, U3 |
| **Missing tests** | 6 | T1, T2, T3, T4, T5, T6 |
| **Follow-up tasks** | 2 | F1, F2 |
| **總計** | **16** | **5 P1 + 6 P2 + 5 P3** |

---

## 🚨 Correctness risks（必修）

### R1 — JWT callback 在每次 request 都打 DB（P1, **TD-803**）
- **檔案**：`lib/auth/config.ts:155-167`
- **問題**：`db.user.findUnique` 在 cache hit / miss 路徑都執行，註解寫「總是查詢，不設條件」 — 直接打掉 Sprint 23 的 session-cache 效能優化。
- **影響**：每次 authenticated request 都多一次 DB round-trip（PK + 2 columns）。在 high-traffic 場景（例如 batch delete 一次調用 N 個 request）會放大。
- **Sprint 28-29 教訓**：「JWT session 不會自動 refresh — cache 只放不常變資料（permissions），常變的（image）獨立 query」。R1 違反了這個原則。
- **建議修法**：只在 cache miss 路徑查 name/image，或拆兩個獨立 cache（`authUserCache` 5 分鐘 vs `permissionsCache` 1 分鐘）。

### R2 — `?filters=` parse 失敗時 silent swallow（P1, **TD-804**）
- **檔案**：`lib/runtime/dynamic-handler.ts:262-279`
- **問題**：`try { ... } catch {}` 吃掉所有錯誤 → 結果是「沒過濾」而非「回 400」。
- **影響**：對齊 R3：表單錯誤容易造成 user 看到不該看到的 rows（資料洩漏風險）。例如前端送的 `?filters=invalid` 被吃掉，handler 退回全表，user 以為篩選有作用。
- **建議修法**：parse 失敗要回 400 或記 warning log。

### R3 — Infinite scroll 無 page 上限（P1, **TD-805**）
- **檔案**：`app/admin/crud/[spec]/page.tsx`（Sprint A 收尾）
- **問題**：`Promise.all(1..N)` 累積查詢，無 max page guard。註解承認「重複 query page 1 為已知 trade-off」，但 user 不斷 scroll → 自我 DoS。
- **建議修法**：hard cap（例如 page ≤ 20）後改 cursor pagination（keyset-based）。

### R4 — Batch delete 缺 TransitionLog + 無 size cap（P1, **TD-806**）
- **檔案**：`app/api/crud/[spec]/route.ts`（Sprint B3）
- **問題**：新加的 `?batch=true` 路徑**沒寫 TransitionLog**（Sprint 31 才把 `cancelEvent` / `completeTodo` 補上 audit log — 同一 pattern 沒套用）。理論上可一次砍整張表（DoS / 誤刪無 audit trail）。
- **建議修法**：加 max batch limit（例如 ≤ 100）+ 每筆刪除寫 TransitionLog。

### R5 — `lib/auth/config.ts` 縮排壞掉（P1, **TD-807**）
- **檔案**：`lib/auth/config.ts:99, 134`
- **問題**：`callbacks: {` 少 2 空格、`if (fresh) {` 少 6 空格 — 這段是繞過 formatter 編輯。
- **建議修法**：跑一次 prettier 再 commit。

---

## 🎨 UX regressions（建議修）

### U1 — 手機 sidebar 缺 Escape 鍵關閉（P2, **TD-808**）
- **檔案**：`app/admin/admin-sidebar.tsx`
- **問題**：開啟後只能用 close button 或 backdrop 關。對 keyboard user 不友善。
- **建議**：加 `useEffect` listener，按 Escape 調 `setIsMobileOpen(false)`。

### U2 — 手機 sidebar 缺 body scroll lock + route-change auto-close（P2, **TD-809**）
- **問題**：
  1. sidebar 開啟時內容仍可滾動（缺 `overflow-hidden` on body）
  2. programmatic navigation 後 sidebar 維持開啟
- **建議**：1. `useEffect` 設/移除 `document.body.style.overflow='hidden'`
  2. `useEffect` 監聽 `pathname` 變化自動關

### U3 — Backdrop 用 `<button>` 違反 keyboard 慣例（P2, **TD-810**）
- **檔案**：`app/admin/admin-sidebar.tsx:115`
- **問題**：backdrop 是 `<button>`，鍵盤 user 必須 Tab 才能關閉。
- **建議**：用 `<div role="presentation">` + click handler，或保留 button 但加鍵盤 listener。

### U4（額外）— Working tree 50+ 檔案未提交（P2, **TD-811**）
- **問題**：刪除 `users-page-client.tsx` / `roles-page-client.tsx`（換成 `*-list-shell.tsx`）的 refactor + Sprint A/B3/C/D + 29-3 + TD-802 全在 working tree，未進任何 commit。
- **風險**：`git checkout .` 會全部遺失；測試也還沒跑過；Sprint 32 reflection 寫「4 Gate 全綠」實際未涵蓋這些。
- **建議**：拆成 4-5 個獨立 commit，每個都跑 Gate 1-4。

---

## 🧪 Missing tests（需補）

| # | TD | 範圍 |
|---|-----|------|
| T1 | **TD-812** | Batch delete RBAC + TransitionLog |
| T2 | **TD-813** | `?filters=` malformed / injection 防護 |
| T3 | **TD-814** | Infinite scroll 上限 + `useTransition` 行為 |
| T4 | **TD-815** | Sidebar Escape / route-change / backdrop 三種關閉路徑 |
| T5 | **TD-816** | JWT `name` / `image` cache miss vs hit 兩條路徑 |
| T6 | **TD-817** | `lib/runtime/batch-delete.ts`（被引用但不在改動清單）— 確認檔案存在 + 有 unit test |

---

## 📋 Follow-up tasks

### F1 — Lockfile 雙軌（TD-818）
- **問題**：`bun.lock` + `pnpm-lock.yaml` 都改動 — 兩個 package manager 共存會讓 CI 一邊裝一邊不裝。
- **建議**：挑一個（推薦 pnpm，CI 已用 `pnpm install --frozen-lockfile`）並 `.gitignore` 另一個。

### F2 — `lib/runtime/batch-delete.ts` 檔案健檢（TD-817）
- **問題**：route.ts 引用 `batchDeleteSpecItems`，但這個檔案不在 working tree 改動清單中。
- **建議**：確認檔案存在、有 unit test、respects permission checks、寫 TransitionLog。

---

## ✅ 修補順序（建議）

1. **先 commit working tree 拆成 4-5 個原子 commit**（U4 / TD-811）— 保護 in-flight 工作
2. **修 R1**（JWT cache）— Sprint 28-29 教訓複用
3. **修 R2 + R3 + R4** — 正確性必修
4. **跑 R5 prettier** — 1 分鐘
5. **補 T1-T6 tests** — 跟 commit 同步
6. **修 U1-U3 UX** — 可排在後續 sprint

---

## 📚 相關文檔

- [Sprint 32 Reflection（positive）](sprint-32.md) — 已 commit 的 RWD 工作
- [Sprint 28-29 Reflection](module-sprint28-29-reflection.md) — JWT image refresh 修法的原始教訓
- [Sprint 27-A Reflection (CRUD 列表頁增強)](module-crud-list-enhancements-reflection.md) — Sprint A/B/C/D/E 的原始設計
- [Sprint 31 Reflection](sprint-31.md) — TransitionLog 模式

---

**下次開工檢查**：Plan Gate 開始時，先確認 TD-803..818 哪些要併入當前 sprint 範圍。