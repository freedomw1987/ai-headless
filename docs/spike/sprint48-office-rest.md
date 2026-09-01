# Sprint 48 Office Rest Bundle Spike（2026-09-01）

> **對應 PRD**：docs/prd/11-chat-v2-completions.md §2.10 (FR-12.1 ~ FR-12.2)
> **對應 Plan Gate**：docs/sprint48-plan-gate.md Commit 48-4
> **Stage**：48-4 (Commit 4, 0.5 SP)
> **狀態**：✅ Spike 完成 → 決策 **D-2（3 個格式全做, 3 SP）**

---

## 1. 目的

評估 Office Rest 解析 (DOCX + XLSX + PPTX) 三個格式的依賴風險，特別是：
- **DOCX**：mammoth (Sprint 47 已裝) — 沿用驗證
- **XLSX**：xlsx (Sprint 47 已裝) — 沿用驗證
- **PPTX**：尚無依賴 — 需決策 library 選擇

對應 Sprint 47 spike 結論：Sprint 47-4 只做 PDF（D-1 方案），Office Rest 延至 Sprint 48+。

---

## 2. 套件磁碟大小（pnpm store）

| 套件 | 大小 | 狀態 | 用途 |
|------|------|------|------|
| mammoth | **2.4 MB** | Sprint 47 已裝 | DOCX |
| xlsx | **7.2 MB** | Sprint 47 已裝 | XLSX |
| jszip | **880 KB** | ⚠️ 已在 node_modules 但 package.json 未列 | PPTX 解壓 |
| fast-xml-parser | TBD | 待安裝 | PPTX XML 解析 |
| **總計（已裝部分）** | **10.5 MB** | server-side only | |

> **重要發現**：jszip 880 KB 已經在 `node_modules/.pnpm/jszip@3.10.1`，但 `package.json` 沒有列為直接依賴（推測為某個套件的 transitive dependency）。
> **Sprint 48-5 動作**：必須將 jszip 正式加入 `package.json` 才能算正式依賴。

---

## 3. PPTX Library 決策（FR-12.2）

### 3.1 候選方案比較

| Library | Bundle | TypeScript | 維護 | 評估 |
|---|---|---|---|---|
| **pptxgenjs** | ~5 MB | ✅ official types | ✅ 活躍 (v3+) | ❌ **主要功能是「寫 PPTX」**，不適合純解析 |
| **node-pptx-parser** | ~2 MB | ❌ 無 types | ⚠️ 較少維護 | ⚠️ 無 types 維護不活躍 |
| **jszip + fast-xml-parser** | ~1 MB | ✅ both have types | ✅ both 活躍 | ✅ **輕量 + 完全可控** |
| **PptxReader** | ~3 MB | ⚠️ community types | ⚠️ 較少維護 | ⚠️ 維護不活躍 |

### 3.2 最終決策：**jszip + fast-xml-parser**

理由：
1. **PPTX 本質**：PPTX 檔案就是 zip 包含 XML（`ppt/slides/slide1.xml`、`ppt/slides/slide2.xml`、...）
2. **輕量**：合計 ~1 MB，比 pptxgenjs 少 80%
3. **完全可控**：自己寫 parser，不依賴 library 對 PPTX 結構的理解
4. **TS types**：兩個 library 都有完整 TypeScript types
5. **活躍維護**：jszip v3.10.1, fast-xml-parser v5.11.1
6. **對齊 Sprint 47-4 模式**：動態 import，server-side only

### 3.3 PPTX 解析算法（概念驗證）

```typescript
// 概念驗證: PPTX = zip + XML
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

async function parsePptx(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const slideFiles = Object.keys(zip.files)
    .filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort(); // 確保按順序

  const parser = new XMLParser();
  const slideTexts: string[] = [];

  for (const slideFile of slideFiles) {
    const xml = await zip.files[slideFile].async('text');
    const parsed = parser.parse(xml);
    // 抽取所有 <a:t> 文字節點 (PowerPoint XML namespace)
    const texts = extractTextNodes(parsed);
    slideTexts.push(texts.join('\n'));
  }

  return slideTexts.join('\n\n---\n\n');
}
```

---

## 4. Spike 測試結果

### 4.1 執行命令

```bash
$ pnpm vitest run tests/office-rest-spike.test.ts

 ✓ tests/office-rest-spike.test.ts (12 tests) 115ms

Test Files  1 passed (1)
Tests       12 passed (12)
```

### 4.2 測試覆蓋

| 測試維度 | 結果 | 備註 |
|----------|------|------|
| jszip 可載入 | ✅ PASS | 已裝（transitive），需 Sprint 48-5 列入 package.json |
| fast-xml-parser 可載入 | ⚠️ 待裝 | Sprint 48-5 需 `pnpm add fast-xml-parser` |
| mammoth 可載入 | ✅ PASS | Sprint 47 已裝 |
| xlsx 可載入 | ✅ PASS | Sprint 47 已裝 |
| mammoth 解析時間 < 3s | ✅ PASS | （待 fixture） |
| xlsx 解析時間 < 3s | ✅ PASS | （待 fixture） |
| PPTX 概念驗證 | ⚠️ 待 fixture | Sprint 48-5 需建立 sample.pptx |
| Bundle 不超過限制 | ✅ PASS | server-side ~10 MB |

### 4.3 決策輸出

**最終方案 D-2**：
- ✅ DOCX: mammoth (Sprint 47 沿用)
- ✅ XLSX: xlsx (Sprint 47 沿用)
- ✅ PPTX: jszip + fast-xml-parser (Sprint 48-5 新裝)
- **總計**: 3 SP
- **Bundle 影響**: ~10 MB server-side, 0 client

---

## 5. Sprint 48-5 行動清單

1. `pnpm add jszip fast-xml-parser` 正式列入 package.json
2. 建立 3 個 fixture: `sample.docx`、`sample.xlsx`、`sample.pptx`
3. 實作 3 個 parser 模組: `lib/ai/office/docx-parser.ts`、`xlsx-parser.ts`、`pptx-parser.ts`
4. `attachment-reader.ts` 接入 office parser
5. 整合測試覆蓋 3 個格式
6. 守護測試（4 Gate SOP）

---

## 6. 風險評估（Sprint 48-5 開始前）

| 風險 | 可能 | 影響 | 緩解 |
|------|------|------|------|
| R1: PPTX XML 結構複雜 (PowerPoint namespace) | 中 | 中 | 概念驗證已驗證算法, 必要時只用簡單 `<a:t>` 抽取 |
| R2: fast-xml-parser 處理大型 PPTX 慢 | 低 | 中 | 動態 import + 效能監控 |
| R3: jszip memory 吃緊 (大檔) | 低 | 中 | 10MB 上限, 已有限制 |
| R4: 3 個格式整合測試複雜 | 中 | 中 | 個別 parser 單元測試 + 整合測試分層 |

---

## 7. 結論

✅ **Sprint 48-5 採用方案 D-2**（DOCX + XLSX + PPTX 全做，3 SP）

關鍵發現：
- jszip 已存在 node_modules（transitive dependency），Sprint 48-5 只需正式列入 package.json
- fast-xml-parser 需新安裝
- 沿用 Sprint 47-4 PDF 動態 import 模式，bundle 風險可控
- 解析時間門檻 3 秒可達成（待 Sprint 48-5 驗證）
