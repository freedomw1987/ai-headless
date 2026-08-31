# Sprint 48 Plan Gate

> **Sprint 範圍**: 清完 Sprint 47 揭露技術債 + 延伸 PDF 成功經驗做 Office Rest
> **日期**: 2026-09-01
> **參與者**: Agent (MiniMax-M3) + 用戶
> **前次 Sprint**: [Sprint 47 Reflection](./reflection/sprint-47-reflection.md)

---

## 對話記錄

### Q1: Sprint 48 範圍方案 — 候選項目要全做、優先做技術債、還是混合做？

**用戶選擇**: 全技術債清理 + 1 新功能 (推薦)

**理由**: 最乾淨，一次清完 Sprint 47 揭露的技術債 + 延伸 Sprint 47-4 PDF 成功經驗做 Office Rest

### Q2: US-S48-OfficeParserRest 範圍 — 三個格式 (DOCX/XLSX/PPTX) 要全做、還是先打 DOCX 試行？

**用戶選擇**: DOCX + XLSX + PPTX 全做 (推薦)

**理由**: 套裝交付最完整，對齊 PRD §2.5 FR-5.2/5.3。但 XLSX/PPTX 需 spike 評估 bundle 風險

### Q3: TD-S47-ChatStatus 型別自訂方式 — 要 「選項 A 完整重構」、「選項 B 輕量轉換」、「選項 C 評估為不修」？

**用戶選擇**: 選項 A: 完整重構 (推薦)

**理由**: 徹底切斷 'ai' SDK 依賴，與 Sprint 45 起不依賴 AI SDK UIMessage 的設計哲學一致

### Q4: TD-S48-UploadOwnershipRefactor — 上傳路由重構方式?

**用戶選擇**: 選項 A: 換成 helper 呼叫 (推薦)

**理由**: 語法一致，helper 集中管理，未來改 ownership 規則只改一處

### Q5: Office Rest 與 Sprint 47-4 PDF 的整合方式?

**用戶選擇**: 選項 A: 延伸 AttachmentContent office 變體 (推薦)

**理由**: reuse Sprint 47-4 既有架構（動態 import + try/finally destroy + AttachmentContent 'office' 變體），降低重複邏輯

### Q6: Sprint 48 整體驗收標準?

**用戶選擇**: 選項 A: 嚴格 4 Gate SOP (推薦)

**理由**: 與 Sprint 47 標準一致，保持 SOP 紀律

---

## Sprint 48 5 Commits

| # | Commit | 內容 | SP | 對應 Backlog |
|---|---|---|---|---|
| 1 | **48-1** | TD-S48-LintCleanup（修 6 個 pre-existing lint 錯誤）| 0.5 | TD-S48-LintCleanup |
| 2 | **48-2** | TD-S47-ChatStatus（自訂型別 + 換 import + 守護測試）| 0.3 | TD-S47-ChatStatus |
| 3 | **48-3** | TD-S48-UploadOwnershipRefactor（upload route 換 helper）| 0.5 | TD-S48-UploadOwnershipRefactor |
| 4 | **48-4** | spike Office Rest bundle（mammoth/xlsx/pptx 評估）| 0.5 | US-S48-OfficeParserRest (前置) |
| 5 | **48-5** | US-S48-OfficeParserRest（DOCX + XLSX + PPTX 解析）| 3 | US-S48-OfficeParserRest |
| **小計** | | | **~4.8 SP** | |

### 暫不處理（仍留 backlog）
- ⏸️ US-S48-SourcesList（P1，若用戶需要可加 Sprint 49）
- ⏸️ CRUD List 增強（既有 backlog，無明確時間）

---

## 對齊 Sprint 47 Reflection 揭露問題

| 揭露問題 | 優先級 | Sprint 48 處理 |
|---|---|---|
| TD-S48-LintCleanup (6 個 pre-existing lint) | P2 | ✅ Commit 48-1 |
| TD-S47-ChatStatus (從 Sprint 46 帶下) | P2 | ✅ Commit 48-2 |
| TD-S48-UploadOwnershipRefactor (風格不一致) | P2 | ✅ Commit 48-3 |
| US-S48-OfficeParserRest (DOCX/XLSX/PPTX) | P1 | ✅ Commit 48-4 + 48-5 |
| US-S48-SourcesList (用戶降階方案) | P1 | ⏸️ 留 Sprint 49+ |

---

## 風險評估

| 風險 | 可能性 | 影響 | 緩解 |
|---|---|---|---|
| R1: pptx 解析 library 選擇不確定 (pptxgenjs vs node-pptx vs 其他) | 中 | 中 | Commit 48-4 spike 先驗證 |
| R2: mammoth/xlsx bundle 過重 | 低 | 中 | 動態 import（沿用 Sprint 47-4 模式）|
| R3: ChatStatus 重構破壞既有 test | 低 | 高 | source-code guard + 完整 4 Gate |
| R4: upload route 重構破壞 multipart 上傳 | 低 | 高 | TDD 紅→綠 + 上傳整合測試 |
| R5: 6 個 lint 錯誤互相耦合 | 中 | 中 | 個別 commit 處理，避免連鎖改動 |

---

## 4 Gate SOP（嚴格）

每個 commit 都跑：

- **Gate 1 TDD**: 寫紅測試 → 實作 → 綠測試
- **Gate 2 Lint+Typecheck**: `pnpm lint` + `pnpm typecheck` 全綠
- **Gate 3 Regression**: `pnpm test` 全綠（既有 1881 tests 不可破壞）
- **Gate 4 Reviewer**: 6 維度校驗（功能/品質/測試/既有/PRD/安全）

---

## 對應 PRD

無新 PRD。Sprint 48 主要處理 Sprint 47 reflection 揭露的技術債 + 延伸 Sprint 47-4 Office Parser 既有架構。

---

## 下一步

1. **Commit Plan Gate 文档**（aa28808 風格）
2. **進 Design Gate**（寫 Sprint 48 PRD 或擴充既有 PRD）
3. **進 Execution Gate**（5 commits）
4. **進 Submit Gate**（reflection + backlog update）
