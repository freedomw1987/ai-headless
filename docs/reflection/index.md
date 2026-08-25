# Reflection 報告索引

> 本目錄存放各 Sprint / US / Module 反省報告。
> **最後更新**：2026-08-26（Sprint 14 完成）

---

## 📊 總覽

| Sprint | 報告 | 狀態 | 完成率 | 4 Gate | 重點 |
|--------|------|------|--------|--------|------|
| Sprint 3 | [sprint-3-reflection.md](./sprint-3-reflection.md) | ✅ | - | - | 初版 |
| Sprint 4 | [sprint-4-reflection.md](./sprint-4-reflection.md) | ✅ | - | - | RWD/UX 改進 |
| Sprint 5 | [sprint-5-reflection.md](./sprint-5-reflection.md) | ✅ | 100% | ✅ 全綠 | Chat 重構 + 6 個 Tech Debt |
| Sprint 6 | [sprint-6-reflection.md](./sprint-6-reflection.md) | ✅ | 100% | ✅ 全綠 | 發現→修復→預防 pattern + TD-514 P0 |
| Sprint 8 | [sprint-8-reflection.md](./sprint-8-reflection.md) | ✅ | 100% | ✅ 全綠 | Demo UI |
| Sprint 9 | [sprint-9-reflection.md](./sprint-9-reflection.md) | ✅ | 100% | ✅ 全綠 | Blog/Event/Todo CRUD + Disable Guard |
| Sprint 10 Phase 1 | [sprint-10-phase-1.md](./sprint-10-phase-1.md) | ✅ | 100% | ✅ 全綠 | Compiler Pipeline 串接 |
| Sprint 10 Phase 2 | [sprint-10-phase-2.md](./sprint-10-phase-2.md) | ✅ | 100% | ✅ 全綠 | 反向驗證揭露 6 個 bug |
| Sprint 11 Phase A | [sprint-11-phase-a.md](./sprint-11-phase-a.md) | ✅ | 100% | ✅ 全綠 | 修產出 bug |
| Sprint 11 Phase B | [sprint-11-phase-b.md](./sprint-11-phase-b.md) | ✅ | 100% | ✅ 全綠 | Disable Guard 自動注入 |
| Sprint 13 | [sprint-13.md](./sprint-13.md) | ✅ | 100% | ✅ 全綠 | Order Schema + 11 個 bug |
| **Sprint 14** | [**sprint-14.md**](./sprint-14.md) | ✅ | **100%** | ✅ **全綠** | **方向大轉彎：Compiler → Runtime** |

---

## 🏆 Sprint 14 重點發現

- **方向大轉彎**：用戶 Sprint 13 完成後反思「不需要 compiler」，Sprint 14 整個推翻 compiler 路線
- **完全移除**：`lib/compiler/`（3656 行）+ 3 scripts + tsconfig.test-compiler.json
- **新增 runtime 模組**：`spec-loader.ts` + `dynamic-handler.ts` + `ui-config.ts`
- **4 spec 全切換**：刪除 19 個 Sprint 9-13 手寫檔案 + 更新 5 個測試
- **揭露並修正真實 bug**：
  1. event / todo spec 缺 `requiresExtension`（Sprint 9 false claim）
  2. `setExtensionEnabled` race bug
  3. Sprint 14 設計差異導致測試期望需調整
- **手動 dev server 驗證**（遵循 Sprint 13 教訓「typecheck 過 ≠ 真能用」）
- **淨改動**：+1880 / -6936 = **-5056 行**

---

## 📐 跨 Sprint 共同觀察

| 觀察 | Sprint 5 | Sprint 6 | Sprint 11-14 |
|------|----------|----------|--------------|
| Reviewer P1 重要 | ✅ TD-501 | ✅ TD-601 | ✅ setExtensionEnabled race |
| 重構揭露深層 bug | ✅ TD-501 | ✅ TD-508 | ✅ Compiler 揭露 11+ bug |
| 預防機制投資高 | ✅ JWT augmentation | ✅ no-floating-promises | ✅ Manual dev server verification |
| E2E 是下一個缺口 | ⚠️ TD-503 | ✅ 已補 | ✅ Sprint 14 E2E 29/29 綠 |
| Typecheck ≠ 真能用 | - | - | ✅ Sprint 13/14 兩次揭露 |

---

## 🗂️ 已歸檔 / 已移除

- ~~`docs/backlog-audit-2026-08-24.md`~~ — Sprint 6 後盤點報告，行動已執行完畢，刪除（2026-08-26）
- ~~`docs/backlog-audit-update-2026-08-24.md`~~ — 第二次盤點更新，刪除
- ~~`docs/sprint-7-plan.md`~~ — Sprint 7 完成後，plan 內容已反映在 Sprint 7 reflection（無獨立 reflection 檔則併入 sprint-6-reflection），刪除
- ~~`docs/sprint-11-plan.md`~~ — Sprint 11 完成後，phase A/B 反思已拆出，刪除