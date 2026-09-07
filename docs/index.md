# 📚 文件中心

歡迎使用 **ai-headless** 文件中心！

> **最後更新**：2026-09-05（Sprint 55 完成後 + 產品化路線圖啟動）

---

## 🚀 入門

| 文件 | 用途 |
|---|---|
| [README.md](../README.md) | 專案總覽 + Quick Start |
| [Getting Started](getting-started.md) | 5 分鐘從零到跑通第一個 CRUD |
| [CHANGELOG](../CHANGELOG.md) | 版本變更歷史 |

---

## 📐 設計

| 文件 | 用途 |
|---|---|
| [System Design](system-design.md) | 系統架構（**Runtime 路線**，Sprint 14 後）|
| [DESIGN](DESIGN.md) | UI/UX 視覺設計規範（顏色 / 字型 / 間距）|
| [Backlog](backlog.md) | Backlog + Sprint 計劃 + 當前狀態（**73KB**，Sprint 1-55）|

---

## 🗺️ 路線圖與產品化（2026-09-05 新增）

| 文件 | 用途 |
|---|---|
| [roadmap/option-a-productization.md](roadmap/option-a-productization.md) | **Option A 產品化路線圖**（Sprint 56-65，2-3 個月衝刺 GA）|
| [roadmap/ga-launch-checklist.md](roadmap/ga-launch-checklist.md) | **GA 上線檢查表**（環境變數 / Security / Backup / Legal / Performance）|

---

## 📋 規範

| 文件 | 用途 |
|---|---|
| [JsonSpec 規範](specs/json-spec.md) | 單一 JSON 規範的完整定義（資料結構 single source of truth，54KB）|
| [Extension 規範](specs/extension-spec.md) | Extension 開發規範（OpenSpec 風格，39KB）|

---

## 📂 PRD（產品需求文件）— **11 個**

| 編號 | 文件 |
|---|---|
| 01 | [框架核心](prd/01-framework-core.md) |
| 02 | [架構設計](prd/02-architecture.md) |
| 03 | [認證 / RBAC](prd/03-auth.md) |
| 04 | [Blog Extension](prd/04-blog.md) |
| 05 | [AI 配置](prd/05-ai-config.md) |
| 06 | [AI Chat](prd/06-ai-chat.md) |
| 07 | [Extension 系統](prd/07-extension-system.md) |
| 08 | [Workflow](prd/08-workflow.md) |
| 09 | [動態 RBAC](prd/09-rbac.md) |
| 10 | [Chat Attachments](prd/10-chat-attachments.md) |
| 11 | [Chat v2 Completions](prd/11-chat-v2-completions.md) |

---

## 🔍 Audit 報告（4 份）

| 報告 | 重點 |
|---|---|
| [Sprint 22 Silent Bug Audit](audit/sprint-22-silent-bug-audit.md) | Phase 1 既有 + Sprint 21 新建 API 端點 silent bug 檢查 |
| [Sprint 46-47 Review](audit/sprint-46-47-review.md) | Sprint 46 收尾 + Sprint 47 Plan Gate Review |
| [Sprint 48 Mid-Review](audit/sprint-48-mid-review.md) | Sprint 48 中期審查（揭露 9 項問題） |
| **🆕 Productization Gap Audit** | [**GA 阻塞 8 項 P0 + 6 項 P1 + 5 項技術債**](audit/productization-gap-audit.md) |

---

## 🔄 Sprint 文件（Sprint 1-55+）

### Plan Gates（規劃）

Sprint 46-55 共 10 個 Plan Gates：

- [Sprint 46](sprint46-plan-gate.md) — Chat Attachments（22 SP / 7 Stage）
- [Sprint 47](sprint47-plan-gate.md) — Chat v2 Completions（13.5 SP / 8 commits）
- [Sprint 48](sprint48-plan-gate.md) — Lint + ChatStatus + Office Rest
- [Sprint 49](sprint49-plan-gate.md) — UIMessage SDK 切斷
- [Sprint 50](sprint50-plan-gate.md) — SourcesList v2 + 附件下載
- [Sprint 51](sprint51-plan-gate.md) — SDK Type Dep 切斷
- [Sprint 52](sprint52-plan-gate.md) — AI 生成 Extension 可行性 + 設計
- [Sprint 53](sprint53-plan-gate.md) — 整合 admin chat + 端到端生成
- [Sprint 54](sprint54-plan-gate.md) — AdminChatDialog Delete Bug Fix
- [Sprint 55](sprint55-plan-gate.md) + [Sprint 55 Design Gate](sprint55-design-gate.md) — AI 生成 extension 端到端 + 產品化衝刺
- **🆕 [Sprint 56](sprint56-plan-gate.md)** — **Email Verification + Password Reset + SMTP（Option A 起點）**

### Reflections（已完成 Sprint 的反省報告）

完整索引見 [reflection/index.md](reflection/index.md)（24KB，列出所有 sprint reflections）。

**最新 sprint reflections**：
- [Sprint 55](reflection/sprint-55-reflection.md) — AI 生成 extension 端到端 + 產品化衝刺
- [Sprint 54](reflection/sprint-54-reflection.md) — Delete Button Bug Fix
- [Sprint 53](reflection/sprint-53-reflection.md) — 整合 admin chat + 端到端生成 product
- [Sprint 52](reflection/sprint-52-reflection.md) — AI 生成 extensions（首次突破 2000 tests）
- [Sprint 46-51](reflection/sprint-46-reflection.md) ... [Sprint 51](reflection/sprint-51-reflection.md)

### Sprint Reviews（跨 sprint review）

- [Sprint 49-53 Review](sprint-review-49-53.md) — 5 sprints 跨期 review（9 項問題揭露）

---

## 🧪 Spike 研究（4 份）

| Sprint | 主題 |
|---|---|
| Sprint 47 | [Office Parser](spike/sprint47-office-parser.md) |
| Sprint 48 | [Office Rest](spike/sprint48-office-rest.md) |
| Sprint 49 | [UIMessage](spike/sprint49-uimessage.md) |
| Sprint 52 | [AI Extension Gen](spike/sprint52-ai-extension-gen.md) |

---

## 🤖 Trust Mode 與對話記錄

| 文件 | 用途 |
|---|---|
| [Trust Log](trust-log.md) | Trust Mode 期間代答決策紀錄 |
| [Need Your Help](need-you-help.md) | Trust Mode 期間的擔憂清單（待用戶決策）|
| [Conversation Log](conversation-log.md) | 用戶 ↔ Agent 重要決策對話 |

---

## 🤝 貢獻

歡迎 PR！請參考 [Getting Started](getting-started.md) 末尾的「貢獻」章節。

---

## 📊 專案統計（2026-09-05）

- **2,221 tests / 228 files** 全綠
- **Sprint 1-55 完成**（當前 Sprint 55 ✅ + Sprint 56 Plan Gate ✅）
- **5 個 Extensions**：blog / event / todo / order / product（每個含 spec.json + manifest.json + workflow code）
- **11 個 PRD**（產品需求文件，Sprint 55 後）
- **97 個 docs/ 內 .md 文檔**
- **MIT 授權**（Sprint 55 補上 LICENSE）

### 架構核心（Runtime 路線，Sprint 14 起）

```
spec.json (Single Source of Truth)
  ├─ runtime loader (lib/runtime/spec-loader.ts)
  ├─ runtime handler (lib/runtime/dynamic-handler.ts) → /api/crud/<spec>
  └─ runtime UI config (lib/runtime/ui-config.ts) → /admin/crud/<spec>

複雜邏輯走 Extension Code：
  ├─ workflow/*.ts (狀態機)
  ├─ hooks/*.ts (副作用)
  ├─ actions/*.ts (自訂操作)
  └─ computed/*.ts (計算欄位)
```

### 產品化進度（2026-09-05）

| 等級 | 完成度 | 變化（最近 1 週） |
|---|---|---|
| Alpha（內部 demo） | **100% ✅** | 不變 |
| Beta（邀請用戶） | **88%** | +3%（Landing Page + LICENSE）|
| GA / Production launch | **52%** | +2%（結構化 logging） |

**離 GA 還有多遠**：見 [audit/productization-gap-audit.md](audit/productization-gap-audit.md) + [roadmap/option-a-productization.md](roadmap/option-a-productization.md)。

預計 **2-3 個月**（Sprint 56-65）可達 GA。