# PRD 02 — Architecture & Design Index

> **模組代號**：M0
> **模組名稱**：Architecture & Design
> **版本**：1.0.0
> **最後更新**：2026-08-24
> **狀態**：Ready for Sprint 1

---

## 1. 模組概述

### 1.1 模組本質

M0 不是一個「代碼模組」，而是 ai-headless 框架的**設計與規範集**。

它由以下文檔組成，每個文檔都是 ai-headless 框架的**規範 source of truth**，所有 AI 開發（透過 pi agent）都依賴這些規範。

### 1.2 為什麼需要 M0？

| 沒有 M0 的問題 | 有 M0 的好處 |
|---|---|
| AI 每次生成風格不一致 | 規範統一，所有 AI 讀同一份 source of truth |
| 用戶自己訂規則 | 框架提供完整規範，AI 自動遵循 |
| 規範散落在各處 | 所有規範集中在 `docs/`，易於維護 |
| 新人不知道從哪看起 | 有清晰的索引（M0 本檔）|

---

## 2. M0 交付物清單

### 2.1 頂層規範文檔（已完成 ✅）

| 文檔 | 路徑 | 用途 | AI 必須讀 |
|---|---|---|---|
| **系統架構** | `docs/system-design.md` | 技術棧、目錄結構、AI Pipeline、模組邊界 | ✅ |
| **UX/UI 設計** | `docs/DESIGN.md` | 設計 tokens、組件風格、佈局原則 | ✅ |
| **Backlog** | `docs/backlog.md` | User Story、Sprint 計劃、進度追蹤 | ✅ |

### 2.2 AI 開發規範（已完成 ✅）

| 文檔 | 路徑 | 用途 | AI 必須讀 |
|---|---|---|---|
| **JSON 功能規範** | `docs/specs/json-spec.md` | AI 生成 CRUD 功能的依據 | ✅ |
| **Extension 開發規範** | `docs/specs/extension-spec.md` | AI 生成 Extension 的依據 | ✅ |

### 2.3 各模組 PRD（部分完成）

| PRD | 路徑 | 模組 | 狀態 |
|---|---|---|---|
| Framework Core | `docs/prd/01-framework-core.md` | M1 | ✅ |
| **Architecture & Design（本檔）** | `docs/prd/02-architecture.md` | M0 | ✅ |
| Auth & RBAC | `docs/prd/03-auth.md` | M2 | ✅ |
| Blog | `docs/prd/04-blog.md` | M3 | 待寫 |
| AI Config | `docs/prd/05-ai-config.md` | M4 | 待寫 |
| AI Chat | `docs/prd/06-ai-chat.md` | M5 | 待寫 |
| Extension System | `docs/prd/07-extension-system.md` | M6 | 待寫 |

---

## 3. 規範設計原則

### 3.1 給 AI 讀的文檔必須包含

所有規範文檔必須具備：

- ✅ **目的說明**：這份規範解決什麼問題
- ✅ **完整結構定義**：JSON Schema + TypeScript Types（如適用）
- ✅ **至少 1 個真實可運行的範例**
- ✅ **最佳實踐**：命名規則、約定、限制
- ✅ **版本號**：semver（用於追蹤演進）
- ✅ **錯誤處理**：常見錯誤場景與解決方法

### 3.2 規範文檔格式

每個規範檔案統一結構：

```markdown
# <規範名稱>

> **版本** + **這份文檔是給誰看的** + **形式**（OpenSpec / Markdown / ...）

## 目錄
## 1. 總覽（為什麼 / 解決什麼問題）
## 2. 結構定義
## 3. 規範細節（每個欄位說明）
## 4. 範例（真實可運行）
## 5. 流程（怎麼使用）
## 6. 最佳實踐
## 7. 錯誤處理
## 8. 版本與變更
## 相關文檔
```

### 3.3 規範一致性規則

| 規則 | 說明 |
|---|---|
| **命名一致** | kebab-case（目錄/檔案）、PascalCase（Model）、camelCase（欄位）|
| **術語統一** | 「JSON Spec」「Extension」「Pipeline」「pi agent」 |
| **格式統一** | 所有規範檔案遵循 3.2 結構 |
| **引用統一** | 所有規範互聯，無孤兒文檔 |

---

## 4. pi agent 自動讀取的文檔清單

每次 pi agent 被啟動（執行 AI Pipeline 任務）時，**自動注入**以下文檔到 context：

| 優先級 | 文檔 | 原因 |
|---|---|---|
| P0（必注入） | `AGENTS.md` | SOP、萬事原則、gates.json 規則 |
| P0（必注入） | `docs/specs/json-spec.md` | 生成 CRUD 功能必讀 |
| P0（必注入） | `docs/system-design.md` | 理解技術棧、模組邊界 |
| P0（必注入） | `docs/DESIGN.md` | 生成 UI 必讀 |
| P1（如需 Extension） | `docs/specs/extension-spec.md` | 生成 Extension 時讀 |
| P1（了解進度） | `docs/backlog.md` | 了解當前 Sprint 狀態 |
| P1（看當前任務） | `docs/prd/<相關 module>.md` | 看具體模組 PRD |

> 💡 為什麼自動注入？因為這些是 source of truth。如果 AI 不知道，會生成不一致的代碼。

---

## 5. 規範演進規則

### 5.1 變更流程

```
[規範需要變更]
   ↓
[更新規範文檔] + [版本號 +1]
   ↓
[更新 Backlog]（加 Defect / Technical Debt）
   ↓
[PR + Review]
   ↓
[更新相關文檔]（cross-reference）
   ↓
[通知所有 AI]（透過 context 自動重新注入）
```

### 5.2 向後相容

| 變更類型 | 向後相容策略 |
|---|---|
| 新增欄位（可選） | ✅ 完全相容 |
| 新增欄位（必填） | ⚠️ 提供 default value + migration guide |
| 重新命名欄位 | ❌ 破壞性，提供 migration script |
| 刪除欄位 | ❌ 破壞性，至少保留 1 個版本的 deprecation warning |

### 5.3 版本記錄

每個規範文檔底部都有「版本與變更」章節：

```markdown
## 11. 版本與變更

| 版本 | 日期 | 變更 |
|---|---|---|
| 1.0.0 | 2026-08-24 | 初版 |
| 1.1.0 | 2026-XX-XX | 新增 X 欄位 |
```

---

## 6. 文檔驗證機制

### 6.1 自動化檢查（CI/CD）

- [ ] **JSON Schema 校驗**：所有 JSON 範例必須通過
- [ ] **TypeScript 編譯**：所有 TS Types 必須通過 `tsc --noEmit`
- [ ] **Markdown 連結**：所有內部連結有效
- [ ] **範例可運行**：所有代碼範例有對應測試

### 6.2 人工 Review

- [ ] 新規範需要架構師 Review
- [ ] 規範變更需要 PR + 至少 1 個 Reviewer
- [ ] 重大變更需要團隊討論

---

## 7. M0 維護 Checklist

### 7.1 新增模組時

- [ ] 在 `docs/system-design.md` 加 Module 表格
- [ ] 在 `docs/prd/` 加 PRD（編號遞增）
- [ ] 更新 `docs/backlog.md` Backlog

### 7.2 修改規範時

- [ ] 更新規範文檔 + 版本號
- [ ] 更新相關範例（如果破壞性）
- [ ] 更新 Backlog（標記 Defect）
- [ ] PR + Review

### 7.3 刪除規範時

- [ ] 確認無 AI / 代碼依賴
- [ ] 保留 deprecated 標記 1 個版本
- [ ] 更新 Backlog

---

## 8. 相關文檔

- 📐 [系統架構](../system-design.md)
- 🎨 [UX/UI 設計](../DESIGN.md)
- 📝 [JSON 功能規範](../specs/json-spec.md)
- 🔌 [Extension 開發規範](../specs/extension-spec.md)
- 📊 [Backlog](../backlog.md)
- 📋 [M1 PRD](./01-framework-core.md)
- 📋 [M2 PRD](./03-auth.md)

---

**M0 維護負責人**：TBD