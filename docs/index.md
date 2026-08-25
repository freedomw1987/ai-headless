# 📚 文件中心

歡迎使用 **ai-headless** 文件中心！

> **最後更新**：2026-08-26（Sprint 14 完成後）

---

## 🚀 入門

| 文件 | 用途 |
|---|---|
| [README.md](../README.md) | 專案總覽 + Quick Start |
| [Getting Started](getting-started.md) | 5 分鐘從零到跑通第一個 CRUD |
| [CHANGELOG](../CHANGELOG.md) | 版本變更歷史（含 Sprint 14 runtime 化記錄）|

---

## 📐 設計

| 文件 | 用途 |
|---|---|
| [System Design](system-design.md) | 系統架構（**Runtime 路線**，Sprint 14 後）|
| [DESIGN](DESIGN.md) | UI/UX 視覺設計規範（顏色 / 字型 / 間距）|
| [Backlog](backlog.md) | Backlog + Sprint 計劃 + 當前狀態 |

---

## 📋 規範

| 文件 | 用途 |
|---|---|
| [JsonSpec 規範](specs/json-spec.md) | 單一 JSON 規範的完整定義（資料結構 single source of truth）|
| [Extension 規範](specs/extension-spec.md) | Extension 開發規範（OpenSpec 風格）|

---

## 📂 PRD（產品需求文件）

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

---

## 🔄 Sprint Reflection（已完成 Sprint 的反省報告）

| Sprint | 重點 |
|---|---|
| Sprint 3 | [初版](reflection/sprint-3-reflection.md) |
| Sprint 4 | [RWD/UX 改進](reflection/sprint-4-reflection.md) |
| Sprint 5 | [Chat 重構 + 6 個 Tech Debt](reflection/sprint-5-reflection.md) |
| Sprint 6 | [發現 → 修復 → 預防 pattern + 揭露 TD-514 P0](reflection/sprint-6-reflection.md) |
| Sprint 8 | [Demo UI](reflection/sprint-8-reflection.md) |
| Sprint 9 | [Blog + Event + Todo CRUD + Disable Guard](reflection/sprint-9-reflection.md) |
| Sprint 10 | [Compiler Pipeline Phase 1+2](reflection/sprint-10-phase-1.md) · [Phase 2](reflection/sprint-10-phase-2.md) |
| Sprint 11 | [Phase A 修產出 bug](reflection/sprint-11-phase-a.md) · [Phase B Disable Guard](reflection/sprint-11-phase-b.md) |
| Sprint 13 | [Order Schema + Extension 教學範例 + 揭露 11 個 bug](reflection/sprint-13.md) |
| **Sprint 14** | [**方向大轉彎：Compiler → Runtime + 4 spec 全切換**](reflection/sprint-14.md) |

完整索引見 [reflection/index.md](reflection/index.md)。

---

## 🔧 開發

| 文件 | 用途 |
|---|---|
| [Getting Started](getting-started.md) | 開發環境設置 |
| [Backlog](backlog.md) | 開發計劃 + 當前 Sprint |

---

## 🤝 貢獻

歡迎 PR！請參考 [Getting Started](getting-started.md) 末尾的「貢獻」章節。

---

## 📊 專案統計（2026-08-26）

- **748 tests / 60 files** 全綠（719 vitest + 29 E2E）
- **Sprint 1-14 完成**（當前 Sprint 14 收尾 ✅）
- **4 個 Extensions**：blog / event / todo / order（每個含 spec.json + manifest.json + workflow code）
- **8 個 PRD**（產品需求文件）
- **編譯時生成程式碼**：0（Sprint 14 移除 compiler pipeline，全部改 runtime 動態組裝）
- **MIT 授權**

### 架構核心（Runtime 路線）

```
spec.json (Single Source of Truth)
  ├─ runtime loader (lib/runtime/spec-loader.ts)
  ├─ runtime handler (lib/runtime/dynamic-handler.ts) → /api/crud/<spec>
  └─ runtime UI config (lib/runtime/ui-config.ts) → /admin/crud/<spec>

複雜邏輯（20%）走 Extension Code：
  ├─ workflow/*.ts (狀態機)
  ├─ hooks/*.ts (副作用)
  ├─ actions/*.ts (自訂操作)
  └─ computed/*.ts (計算欄位)
```