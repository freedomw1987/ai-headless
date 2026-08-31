# Sprint 47 Office Parser Bundle Spike（2026-08-31）

> **對應 PRD**：docs/prd/11-chat-v2-completions.md §2.5 (FR-5)
> **對應 Plan Gate Q4**：docs/sprint47-plan-gate.md
> **Stage**：47-0 (Commit 1, 0.5 SP)
> **狀態**：✅ Spike 完成 → 決策 **D-1（只做 PDF, 2 SP）**

---

## 1. 目的

評估 `pdf-parse` / `mammoth` / `xlsx` 三個套件對 ai-headless 專案的影響：
- 真實解析正確性（用 fixture 檔實測）
- 解析時間（效能門檻 < 3 秒）
- Bundle size 影響（client + server）
- 與 Sprint 47 整體時程的權衡

---

## 2. Spike 測試結果

### 2.1 套件安裝

```bash
$ pnpm add pdf-parse mammoth xlsx
+ mammoth 1.12.2
+ pdf-parse 2.4.5
+ xlsx 0.18.5
Done in 3m 34.2s
```

### 2.2 套件磁碟大小（pnpm store）

| 套件 | 大小 | 用途 |
|------|------|------|
| pdf-parse | **21 MB** | PDF（包含 pdfjs-dist）|
| mammoth | 2.4 MB | DOCX |
| xlsx | 7.2 MB | XLSX |
| **總計** | **30.6 MB** | server-side only |

### 2.3 測試結果（pnpm vitest run tests/office-parser-spike.test.ts）

```
✓ tests/office-parser-spike.test.ts (7 tests) 360ms

Test Files  1 passed (1)
Tests       7 passed (7)

stdout:
[PDF]  解析時間: 1 ms   ← sample.pdf (614B, 2 頁)
[DOCX] 解析時間: 4 ms   ← mammoth 自帶 single-paragraph.docx (12KB)
[XLSX] 解析時間: 1 ms   ← sample.xlsx (16KB, 3 列)
```

| 測試 | 結果 | 時間 | 內容驗證 |
|------|------|------|----------|
| PDF 解析 | ✅ PASS | 1 ms | 提取「Sprint 47 Office Parser Spike」文字 |
| PDF 時間 | ✅ PASS (<3s) | 1 ms | — |
| DOCX 解析 | ✅ PASS | 4 ms | 提取「Walking on imported air」文字 |
| DOCX 時間 | ✅ PASS (<3s) | 4 ms | — |
| XLSX 解析 | ✅ PASS | 1 ms | CSV 包含 Name/Alice/Bob 3 列 |
| XLSX 時間 | ✅ PASS (<3s) | 1 ms | — |
| Spike 文件位置 | ✅ PASS | — | 指向本檔 |

### 2.4 Fixture 檔

```
tests/fixtures/office-parser/
├── sample.pdf   614 B    (2 頁, "Sprint 47 Office Parser Spike")
├── sample.docx  12 KB    (從 mammoth/test-data 借)
├── sample.xlsx  16 KB    (3 列, "Name,Age,City")
└── sample.csv   46 B     (輔助測試, 非 spike 必要)
```

---

## 3. Bundle Size 影響分析

### 3.1 Client Bundle 影響

**結論：0 KB**

**理由**：
- `pdf-parse` / `mammoth` / `xlsx` 都只在 `lib/ai/chat/attachment-reader.ts` 用
- `attachment-reader.ts` 是 server-side util（只被 API route import）
- Next.js webpack 不會把 server-only module 包進 client bundle
- 驗證：`grep -r "attachment-reader" app components` → 只有 `app/api/admin/chat/stream/route.ts` 用 → server-only

### 3.2 Server Bundle 影響

**結論：30.6 MB 增加**

| 套件 | server bundle 增量 |
|------|-------------------|
| pdf-parse | ~21 MB（含 pdfjs-dist, 真正進 bundle 約 5-8 MB）|
| mammoth | ~2.4 MB |
| xlsx | ~7.2 MB |

**Vercel Serverless Function 限制**：
- Hobby plan：50 MB（uncompressed）
- Pro plan：250 MB

**實際影響**：spike 套件 + 既有依賴，總 server bundle 可能接近 100 MB。在 Hobby plan 邊緣。

### 3.3 解析時間影響

**結論：完全可接受**

| 格式 | 解析時間 | 對用戶感覺 |
|------|----------|-----------|
| PDF (614B, 2 頁) | 1 ms | 瞬間 |
| DOCX (12 KB) | 4 ms | 瞬間 |
| XLSX (16 KB, 3 列) | 1 ms | 瞬間 |

> 註：spike 用小檔案，production 用 10 MB 上限 PDF 可能 100-500 ms，仍可接受。

---

## 4. 決策分析

### 4.1 Plan Gate Q4 三方案對照

| 方案 | 內容 | SP | 預估總 Sprint 47 |
|------|------|----|------------------|
| **A**（全做）| PDF + DOCX + XLSX + PPTX | 5 SP | 17.3 SP |
| **B**（只 PDF）| 只 PDF parser | 2 SP | 14.3 SP |
| **C**（延 Sprint 48）| 不做 | 0 SP | 12.3 SP |

### 4.2 優缺點對照

| 方案 | 優點 | 缺點 |
|------|------|------|
| **A** | 完整覆蓋 PDF/DOCX/XLSX/PPTX | server bundle +30 MB；3 SP 開發量 |
| **B** | 最常用格式（PDF）；bundle 只 +5 MB | 缺 DOCX/XLSX 用戶失望 |
| **C** | 0 風險、bundle 0 增加 | Sprint 47 少一條腿；Office 用戶沒體驗 |

### 4.3 使用場景預估

依 Sprint 46 PRD §1.1（80/20 法則）：
- 文字附件：50% use case（Sprint 46 已做 ✅）
- 圖片附件：30% use case（Sprint 47 FR-3 已做 ✅）
- Office 附件：20% use case（其中 PDF 12% / DOCX 4% / XLSX 3% / PPTX 1%）

---

## 5. 最終決策

### ✅ **D-1 方案：只做 PDF（2 SP）**

**理由**：
1. **Bundle 控管**：pdf-parse 5-8 MB 還可接受；mammoth + xlsx 共 9.6 MB 是額外負擔
2. **80/20 法則**：PDF 佔 Office 附件 12/20 = 60% use case
3. **Sprint 47 整體時程**：保留 14.3 SP 給其他 6 個主題，安全守護 + cleanup cron 不能被砍
4. **DOCX/XLSX 延 Sprint 48**：屆時若有強烈需求再做，且可能有更輕量替代品（如 `docx-preview` + `csv-parse`）

### 5.1 Sprint 47 收尾 SP 重新計算

| 主題 | 原 SP | 修訂後 SP |
|------|-------|-----------|
| 47-0 Office Spike | 0.5 | **0.5** ✅ 完成 |
| 47-1 Sources/Reasoning | 2 | **2** |
| 47-2 Vision | 2 | **2** |
| 47-3 Frontend Upload | 4 | **4** |
| 47-4 Office Parser (PDF only) | 5/2/0 | **2** ⬇️ |
| 47-5 Cleanup Cron | 2 | **2** |
| 47-6 Session Ownership | 1 | **1** |
| 47-7 Markdown XSS | 0.5 | **0.5** |
| **總計** | 17.3 SP | **14 SP** ⬇️ 3 SP |

### 5.2 Sprint 47 FR 縮減

砍掉 FR-5.2 (DOCX parser) + FR-5.3 (XLSX parser) + FR-5.5 (整合測試 XLSX)：
- ❌ FR-5.2 DOCX parser（mammoth）
- ❌ FR-5.3 XLSX parser（xlsx）
- ❌ FR-5.5 整合測試 XLSX
- ❌ FR-5.6 PPTX（原本就沒列）

保留：
- ✅ FR-5.1 PDF parser（pdf-parse）
- ✅ FR-5.4 attachment-reader 接 PDF parser
- ✅ FR-5.5 整合測試 PDF

### 5.3 Sprint 48+ TODO

- DOCX parser（mammoth，視用戶反應決定）
- XLSX parser（xlsx，視用戶反應決定）
- PPTX parser（jszip + XML，低優先）

---

## 6. 4 Gate 驗收紀錄

### Gate 1 TDD
- ✅ 測試先紅（沒裝套件 → Failed Suites 1）
- ✅ 補套件 + fixture 後測試綠（7 tests passed）

### Gate 2 Lint + Typecheck
- ✅ pnpm typecheck 全綠（0 error）
- ⚠️ pnpm lint 有 5 個 pre-existing error（與 spike 無關，spike 自身 0 error）

### Gate 3 Regression
- ✅ pnpm test 全部通過（189 files / 1802 tests / 20.26s）

### Gate 4 Reviewer
- ✅ 套件磁碟 30.6 MB（server-side only）
- ✅ Client bundle 0 KB 影響
- ✅ 解析時間全 < 5 ms（門檻 < 3 秒 ✅）
- ✅ Spike 決策文件（本檔）產出

---

## 7. 對 Sprint 47 PRD 的影響

### 7.1 PRD §2.5 FR-5 縮減

**原**：
```
| FR-5.1 PDF parser | 1 SP |
| FR-5.2 DOCX parser | 1.5 SP |
| FR-5.3 XLSX parser | 1 SP |
| FR-5.4 attachment-reader 接 new parser | 0.5 SP |
| FR-5.5 整合測試 3 種檔案解析 | 0.5 SP |
| FR-5.6 bundle 影響評估文件 | 0.5 SP |
```

**修訂後**：
```
| FR-5.1 PDF parser (pdf-parse) | 1 SP |
| FR-5.4 attachment-reader 接 PDF parser | 0.5 SP |
| FR-5.5 整合測試 PDF 解析 | 0.5 SP |
```

**刪除**：FR-5.2 (DOCX) + FR-5.3 (XLSX) + FR-5.6 (bundle 評估, 本檔已做完)

### 7.2 PRD §2.9 總計修訂

| 主題 | 原 SP | 修訂後 SP |
|------|-------|-----------|
| FR-5 Office Parser | 5 (條件) | **2** (只 PDF) |
| **總計** | 17.3 SP | **14 SP** |

### 7.3 PRD §14.3 Sprint 47 收尾預期修訂

| 項目 | 原 | 修訂後 |
|------|----|--------|
| Unit/Integration | +46 → 1841 | **+18** → **1813**（spike 7 + 47-4 11 = 18）|
| E2E | +8 → 141 | **+8** → **141**（不變）|
| 守護測試 | +5 | **+4**（刪 FR-5.6 bundle guard）|
| Commit 數 | 8 | **8**（不變, 47-4 還是有 spike → 47-4 commit）|
| **總計** | 17.3 SP / 17 天 / 8 commits | **14 SP / 14.5 天 / 8 commits** |

---

## 8. 下一步

- ✅ Spike 完成
- ⏭️ 進入 Commit 2（Stage 47-1 Sources/Reasoning UI, 2 SP）
- ⏭️ 依序 Commit 3-8（含 Commit 5 = FR-5 修訂版只 PDF, 2 SP）

---

## 9. 附錄

### 9.1 套件來源

- pdf-parse v2.4.5：https://github.com/mehmet-kozan/pdf-parse
  - API：class `PDFParse({ data: Uint8Array }).getText()` + `parser.destroy()`
- mammoth v1.12.2：https://github.com/mwilliamson/mammoth.js
  - API：`extractRawText({ path })`
- xlsx v0.18.5 (SheetJS)：https://github.com/SheetJS/sheetjs
  - API：`XLSX.readFile(path)` + `XLSX.utils.sheet_to_csv(sheet)`

### 9.2 相關文檔

- PRD §2.5 FR-5：docs/prd/11-chat-v2-completions.md
- Plan Gate Q4：docs/sprint47-plan-gate.md
- Sprint 46 Attachment Cleanup：lib/ai/chat/attachment-cleanup.ts
- Sprint 46 Attachment Reader：lib/ai/chat/attachment-reader.ts
- Sprint 46 MIME Validator：lib/ai/chat/mime-validator.ts
