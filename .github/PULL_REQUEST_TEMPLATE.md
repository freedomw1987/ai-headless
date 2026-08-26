<!--
SOP-R1: API endpoint PR Checklist (Sprint 22 audit)
對應: docs/reflection/sprint-22.md + docs/audit/sprint-22-silent-bug-audit.md
-->

## 📋 變更說明

<!-- 簡述這個 PR 改什麼、為什麼改 -->

## 🔗 相關連結

<!-- Link 到 PRD / Backlog / Issue / 對應 Sprint 任務 -->

- PRD:
- Backlog:
- Issue:

## 🏷️ 類型

- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] ♻️ Refactor
- [ ] 📝 Docs
- [ ] 🧪 Test
- [ ] 🔧 Chore / Tooling

---

## 🚦 SOP-R1 Checklist（新 API endpoint 必填）

> **來源**: [docs/audit/sprint-22-silent-bug-audit.md](../../docs/audit/sprint-22-silent-bug-audit.md)
> **目的**: 防止 silent bug（destructure 但未使用 / enum 寫死 / FK 缺 backfill）

如果這個 PR **新增或修改 API endpoint**，必須勾選以下：

- [ ] **🔴 Destructure vs Data**：body destructure 的所有欄位都在 `db.create.data` / `db.update.data` 中實際使用
  - 用 `grep -E "const \{ [^}]+ \} = body"` 確認 destructure 完整
  - 用 grep 對照每個 destructure 欄位在後續程式碼是否出現

- [ ] **🟡 無寫死 enum 驗證**：沒有使用 `VALID_X = ['admin', 'editor', 'viewer']` 寫死驗證
  - 應改用 `db.role.findUnique({ where: { name } })` 動態查詢
  - 或 Zod schema 配合 DB 驗證

- [ ] **🟢 Optional FK backfill**：如果新增了 optional FK 欄位，既有資料的 backfill 已在同一 migration 處理
  - 例：`ALTER TABLE users ADD COLUMN roleId String; UPDATE users SET roleId = (SELECT id FROM roles WHERE name = users.role);`
  - 新人 clone 時 `prisma migrate deploy` 自動套用

---

## 🚦 4 Gate 驗證

- [ ] **Gate 1 — TDD**：測試先紅後綠（已 commit 測試失敗輸出 + 通過輸出）
- [ ] **Gate 2 — lint + typecheck**：`pnpm lint` 與 `pnpm typecheck` 全綠
- [ ] **Gate 3 — regression**：`pnpm test` 既有測試全綠，無破壞
- [ ] **Gate 4 — reviewer**：自我檢查 quality（destructure / 錯誤處理 / 交易 / 索引 / 安全）

## 🧪 測試

- [ ] 單元測試（如適用）
- [ ] 整合測試（如適用）
- [ ] E2E 測試（如適用，Phase 1 已有 Playwright 設定）
- [ ] 手動 dev server 驗證截圖（UI 變更必填）

## 📝 文件

- [ ] Sprint reflection 更新（每 Sprint 收尾必填）
- [ ] CHANGELOG 更新（如適用）
- [ ] README 更新（如適用）
- [ ] docs/PRD 更新（如適用）

## 🔒 安全性

- [ ] 沒有 hardcoded secrets / API keys
- [ ] SQL injection 已防護（Prisma 自動，但 sort/filter 欄位需白名單）
- [ ] 權限檢查正確（API endpoint 應有 `requirePermission` 或等價守衛）
- [ ] 沒有把密碼 / token 回傳給前端（`sanitizeUser` helper）

## ⚡ 性能

- [ ] DB 查詢有適當索引（Prisma schema 檢查）
- [ ] 大量資料場景有分頁（避免 `take: 100` 寫死）
- [ ] 快取策略明確（60s TTL / invalidate API）

## 🧪 SOP-R2 自動檢測（可選）

執行此 grep 確認沒有 destructure silent bug：

```bash
for f in $(find app/api -name "route.ts"); do
  matches=$(grep -E "const \{ [^}]+ \} = body|const \{ [^}]+ \} = await req" "$f" 2>/dev/null)
  if [ -n "$matches" ]; then
    echo "--- $(echo $f | sed 's|app/api/||;s|/route.ts||') ---"
    echo "$matches"
  fi
done
```

對每個 output 確認：欄位都在 `db.create.data` / `db.update.data` 中實際使用。

---

## 📸 截圖（如 UI 變更）

<!-- 貼 dev server 驗證截圖 -->

## 📝 備註

<!-- 其他 reviewer 需要知道的事 -->