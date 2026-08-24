# Reflection 報告索引

> 本目錄存放各 Sprint / US / Module 反省報告。

## 總覽

| Sprint | 報告 | 狀態 | 完成率 | 4 Gate | 測試數 |
|--------|------|------|--------|--------|--------|
| Sprint 3 | [sprint-3-reflection.md](./sprint-3-reflection.md) | ✅ | - | - | - |
| Sprint 4 | [sprint-4-reflection.md](./sprint-4-reflection.md) | ✅ | - | - | - |
| Sprint 5 | [sprint-5-reflection.md](./sprint-5-reflection.md) | ✅ | 100% | ✅ 全綠 | 639 |
| **Sprint 6**（起步 4 Task） | [sprint-6-reflection.md](./sprint-6-reflection.md) | ✅ | **100%** | ✅ 全綠 | **649** |

## Sprint 6 Reflection 摘要

- **範圍**: TD-601 修復（原 TD-405-alt）+ US-S6-1 + TD-508 + TD-509
- **結果**: 4/4 完成，4 Gate 全綠
- **新增 Backlog**: 6 個（TD-601 + TD-510 ~ TD-514 + US-S6-2 沿用）
- **核心 Pattern**: 發現 → 修復 → 預防 三階段
- **最大缺口**: **TD-514 (CI workflow) P0** — 沒 CI = 沒保護

## 跨 Sprint 共同觀察

| 觀察 | Sprint 5 | Sprint 6 |
|------|----------|----------|
| Reviewer P1 重要 | ✅ TD-501 stale closure race | ✅ TD-601 floating promise |
| 重構揭露深層 bug | ✅ TD-501 | ✅ TD-508 |
| 預防機制投資高 | ✅ JWT augmentation + ESLint flat config | ✅ no-floating-promises + smoke test |
| E2E 是下一個缺口 | ⚠️ TD-503 UI abort 場景缺測試 | ✅ 已補（3 場景）；⚠️ 缺 CI 自動跑 |