# 對話記錄（Conversation Log）

> **目的**：保留重要的用戶 ↔ Agent 對話決策，方便日後追溯為何做某個決定。
>
> **來源**：從 `docs/backlog.md` 移出（2026-08-30 backlog 可讀性改進 Sprint）
>
> **完整對話日誌**：見 `docs/reflection/` 目錄各 Sprint reflection 報告。

---

## Date Time：2026-08-26 17:30（Sprint 21 開工 + US-102-P2 動態 RBAC）

> 用戶：項目中有什麼開發任務？（查 Sprint 20 進度）
> BA(我)：列出 Sprint 20 全收尾（7/7 SP）+ Sprint 21 候選任務（推薦 US-102-P2 動態 RBAC）
> 用戶：好，1（選 Sprint 21 US-102-P2）
> BA(我)：依 SOP 進 Plan Gate，一次一個問題問 Q1-Q4
> Q1 用戶：A — 內建3 個 role 不能刪
> Q2 用戶：A — 小寫 + 底線 + ≤32 字 + 唯一 + 預留保留字
> Q3 用戶：A — `/admin/roles` 公開但只有 admin 可進可改
> Q4 用戶：A — 只有 admin 能授權權限
> BA(我)：寫入 `docs/backlog.md` US-102-P2 開工 checklist + 新建 `docs/prd/09-rbac.md`
> 用戶：1（先解決 Q5-Q7 技術問題）
> BA(我)：Q5 Session strategy → 用戶 A（JWT + 1 分鐘快取 + 失效 API）
> 用戶：但做之前先整理 `backlog.md` 讓他可讀
> BA(我)：發現實際 631 行（不是 843），推薦 A 方案（小整理 + 建 Sprint 20 reflection）
> 用戶：A
> BA(我)：新建 `docs/reflection/sprint-20.md` + 精簡 `backlog.md` Sprint 20 五段（6 頁 → 1 頁 + 6 行連結表）+ reflection/index.md 加 Sprint 20 行
> 用戶：好，1（先把 Q5 寫進 PRD，然後進 Q6）
> BA(我)：PRD 開頭狀態列更新 + 新增 §12 Plan Gate 紀錄 + §12.3 Q5 詳細設計（架構圖 + 4 個關鍵改動 + Sprint 20 技術債連動表 + SP 影響）；backlog.md Sprint 21 規劃表 Q5 狀態同步
> Q6 用戶：A — 保留純函式 + 漸進式遷移（雙函式 4 Sprint 計畫，Sprint 25 強制清）
> BA(我)：PRD 新增 §12.4 Q6 詳細設計（雙函式 API 範例 + 漸進式遷移順序表 + Sprint 25 強制清規則 + 風險控制手段）；backlog.md Sprint 21 規劃表 Q6 狀態同步
> Q7 用戶：A — 保留寫死矩陣測試 + 新增動態查 DB 測試（漸進式）
> BA(我)：PRD 新增 §12.5 Q7 詳細設計（測試集分區策略 + 純函式微調範例 + 動態測試範例 + 與 Q5/Q6 關聯）；新增 §13 Plan Gate 完成總結（7 個決策一覽 + Sprint 21 最終 SP 8.25 SP + Plan Gate 完成證明 + Design Gate 待辦）；backlog.md Sprint 21 規劃表 Q7 狀態同步 + 「下一個 P0」改為 Design Gate
> 結果：Sprint 21 Plan Gate ✅ 完成（Q1-Q7 全解決，PRD 8.25 SP）。下一步：Design Gate（wireframe + Task 順序微調 + seed 詳寫）
> 用戶：1（進 Design Gate）
> BA(我)：Design Gate 4 個待辦全完成。
> 待辦 1（wireframe）：PRD §4.3 加 Mermaid RBAC 流程圖（ASCII 保留為 fallback）+ §4.4 Sprint 21-25 漸進式遷移 Gantt 圖
> 待辦 2（Task 順序）：PRD §8 拆 Task 4 成 4a/4b/4c（cache + 雙函式 + 失效 API）+ 拆 Task 12 成 12a/12b（既有測試更新 + 新增動態測試）+ 加 §8.1 Task 依賴關係圖
> 待辦 3（seed）：PRD §5.3 BUILTIN_ROLES + BUILTIN_PERMISSIONS_BY_ROLE + PermissionCode 常數 + idempotent upsert 完整 TS 實作 + 4 個關鍵設計說明
> 待辦 4（commit）：PRD 新增 §8.2 Commit 規劃（9 個 commit 表 + 5 個規劃原則 + 7 天開發順序）+ backlog.md「下一個 P0」改為 Execution Gate
> 結果：Sprint 21 Design Gate ✅ 完成（4 個待辦全解決，PRD 完備）。下一步：Execution Gate（Gate 1 TDD → Gate 2 lint → Gate 3 regression → Gate 4 reviewer + E2E）

---

## Date Time：2026-08-24 11:31（框架起點）

> 用戶：AI 開發不同項目有 3 個痛點：(1) UI/UX/架構不一致 (2) CRUD 是主需求但 AI 出錯多 (3) 想建立一套技術框架讓 AI 按規範開發
> BA(我)：先釐清框架形態
> 用戶：想用 JSON 規範同時約束前端、後端、DB Schema
> BA(我)：推薦 A 方案 — Headless Web Framework + AI Coding Guide
> 用戶：A 方案，最終 AI 能根據用戶需求生成系統
> BA(我)：框架是底基，用戶可改樣式、可加 Extension
> 用戶：Q1 = WordPress 風格終端用戶框架，含用戶管理、登入、權限、Blog 等底座
> 用戶：Q2 = A（MVP）
> 用戶：Q3 = A（Next.js 原生 + JSON 註冊）
> 用戶：Q4 = C（OpenAI + Claude 雙模型可切換）
> 用戶：Q5 = JSON 不在 UI 暴露，但生成後可下載 .json 給用戶打開看
> 用戶：Q6 = A（Extension 規範用 OpenSpec 風格：MD + JSON + TS + 範例）
