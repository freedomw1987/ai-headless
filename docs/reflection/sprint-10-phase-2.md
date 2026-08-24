# Sprint 10 Phase 2 反省 — Compiler Bug 揭露 + 規劃 Sprint 11

> **Sprint**: Sprint 10 — Compiler Pipeline Phase 2（反向驗證 Blog Extension）
> **反省日期**: 2026-08-25
> **結論**: **Phase 2 部分完成** — 揭露多個 compiler bug；規劃 Sprint 11 修補

---

## 🎯 Phase 2 目標 vs 結果

| 目標 | 結果 |
|---|---|
| Compiler 真實寫磁碟 | ✅ 完成（outputBase 選項） |
| 與 Sprint 9 手寫比對差異 | ✅ 完成（diff report） |
| 修差異直到完全等價 | ⚠️ **未完成** — 揭露 5+ 個 compiler bug |
| Sprint 9 全部 E2E 通過 compiler 產出 | ❌ 未嘗試（產出程式無法 typecheck） |

---

## 📊 改動清單

### Compiler 修的 bug（Phase 2 範圍內）
1. **orchestrator 多 method 合併**：原本 6 routes → 9 written files 撞同一檔；改用 `mergeHandlerCodes` 正確合併同 path 的多 method code
2. **UI page suffix**：原本 `page.path = '/admin/blog/[id]'` 我加 `[id]/page.tsx` → 變 `/admin/blog/[id]/[id]/page.tsx`；改成統一加 `page.tsx`
3. **`outputBase` 選項**：避免覆蓋 Sprint 9 手寫檔，可輸出到 `_compiled/`
4. **PATCH 一致化**：compiler PUT 改 PATCH（與 Sprint 9 一致）

### 揭露的 compiler 產出 bug（Phase 2 範圍外，留 Sprint 11）

| # | Bug | 影響 |
|---|---|---|
| 1 | api-generator Zod schema 在 body 切斷時丟失 | POST/PATCH 不能用 |
| 2 | api-generator 生成不存在的 import（`runAction`, `triggerWorkflowTransition`）| typecheck 失敗 |
| 3 | api-generator 引用不存在的函數（`hookFn(model.hooks?.x)`）| runtime 失敗 |
| 4 | api-generator `ctx.params` 沒 Promise wrap | runtime 失敗 |
| 5 | ui-generator 完全沒生成 workflow transition 按鈕 | 功能缺失 |
| 6 | compiler 沒生成 disable guard | Sprint 9 揭露的需求 |

---

## 🔍 關鍵發現：Compiler 不是「可運行的東西」

### 揭露真相
- `lib/compiler/` 4 個 generator（schema/api/ui/permission）**從未被完整 typecheck 過**
- Sprint 2-9 期間被當作「未完成的遺產」，沒人實際 `pnpm compile && typecheck` 驗證
- Phase 1 透過 dry-run 看到「生成 6 routes + 3 pages」以為成功 — **沒發現是「程式碼生成」成功，但「產出無法運行」**

### 這是重大教訓
- **compiler pipeline 必須跑 typecheck**：Sprint 10 Phase 1 沒做這步，導致 Phase 2 才發現
- **Phase 1 缺一個步驟**：「生成後跑 typecheck 看程式能否運行」
- **dry-run 不夠**：要「real-write-to-temp + typecheck」

---

## 📋 Sprint 11 規劃（10 SP）

詳見 `docs/sprint-11-plan.md`

### Phase A — 修 compiler 產出 bug（必做，7 SP）
- TECH-018 修 api-generator schema 丟失 + 假 import（3 SP）
- TECH-019 修 api-generator hook 引用錯誤（1 SP）
- TECH-020 修 api-generator ctx.params Promise wrap（1 SP）
- TECH-021 統一編譯結果 typecheck 通過（2 SP）

### Phase B 部分 — Disable Guard 自動注入（3 SP）
- TECH-022 compiler 自動注入 `guardExtensionApi`（2 SP）
- TD-522 Order manifest 缺失補完（0.5 SP，順手做）

### 不在 Sprint 11
- Sidebar 自動加 nav item（留 Sprint 12）
- Workflow button 自動生成（留 Sprint 12）
- 4 個 extension 全遷移（留 Sprint 12-13）

---

## 🎓 教訓

1. **Compiler 真實寫磁碟 + typecheck 是必要驗證**：Phase 1 只做 dry-run 不夠
2. **「完成」要定義清楚**：Phase 2 目標寫「與 Sprint 9 等價」，但實際只到「路徑結構等價」
3. **未跑過的程式不能算 working**：Sprint 2 寫的 compiler 從未完整 typecheck，這是 tech debt
4. **Phase 拆分很重要**：Phase 1 完成 ≠ Phase 2 開始，Phase 1.5 應該做「真實寫檔 + typecheck」驗證
5. **不盲目衝刺**：Phase 2 後半看到多個 bug，**果斷停止**比「硬撐修完」明智
