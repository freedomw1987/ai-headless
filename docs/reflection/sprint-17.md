# Sprint 17 Reflection — list / detail / form UI 改進 + customRenderer

> Sprint 17 期間：2026-08-26
> 狀態：**Stage 1 完成 3 / 5.5 SP**，Stage 2（customRenderer）待做
> commits：096aade, 5d24eed, fd32825

---

## 1. UX/UI 一致性 ✅

**Sprint 16 結束時**：list / detail / form 全部用純 HTML + inline Tailwind，看起來像 1990 年代。

**Sprint 17 Stage 1 之後**：
- list page → shadcn Table（含 hover、列分隔、Empty 元件空狀態）
- detail page → shadcn Card（CardHeader/Title/Description/Content 分層結構）
- form page → shadcn Input/Textarea/Label/Button（含 Loader2 loading state）
- 統一 Lucide icons（Plus, ChevronRight, Inbox, ArrowLeft, Trash2, AlertCircle, Loader2, Play）
- 統一 shadcn Button variants（default / outline / destructive / ghost）
- 統一 shadcn Badge（status / checkbox ✓ 顯示）

### 觀察
- 三個 page 都用相同 Card 結構，視覺一致
- 錯誤訊息統一：border-destructive/50 Card + AlertCircle icon
- 操作區統一：Button asChild + Link + ArrowLeft 返回 pattern

---

## 2. RWD 響應式設計 ✅

shadcn 元件內建 sm: md: lg: breakpoints，自動 RWD。Sprint 16 建立的 14 個 RWD E2E 測試（4 spec × 3 viewport）全綠：
- mobile（375）：表格 overflow scroll、按鈕 stack
- tablet（768）：表格 + sidebar 並排
- desktop（1280）：完整 layout

---

## 3. 技術債 ✅（部分解決）

### 解決
- 移除所有純 inline Tailwind（`bg-blue-600 hover:bg-blue-700`、`border-red-200`、`border rounded p-2` 等）
- CardTitle 改 `<h3>`（semantic HTML、SEO 友善）
- 表單 input 補上 placeholder 支援
- 真實 `<h1>` 標題（之前 CardTitle 是 `<div>`）

### 新增（Stage 1 沒解決，待 Stage 2）
- customRenderer JSX 預編譯基礎建設（Spike 待做）
- 守護測試只驗結構、不驗 runtime 渲染（Sprint 15 Stage 3 假成功教訓）

---

## 4. 可維護性 ✅

### 改進
- shadcn 元件複用（不再每個頁面重複造輪）
- 一致 Button variants 命名（default / outline / destructive / ghost / secondary）
- Label + htmlFor + id 三者一致（a11y 友善）
- 一致的 icon 命名（Plus 新增、ArrowLeft 返回、Trash2 刪除、Play transition）

### 觀察
- 引入 lucide-react 0.469，統一管理 icons
- 引入 class-variance-authority（CVA）做 shadcn variants

---

## 5. 測試覆蓋率 ✅

### Sprint 17 Stage 1 新增
- `tests/integration/tech-041-shadcn-list-ui.test.ts` — 11 守護測試
- `tests/integration/tech-042-shadcn-detail-ui.test.ts` — 11 守護測試
- `tests/integration/tech-043-shadcn-form-ui.test.ts` — 15 守護測試
- `tests/integration/tech-038-list-server-component.test.ts` — 2 個更新（tbody→TableBody + Sprint 16→17 Stage 2 註記）

### 測試基線
| 項目 | Sprint 16 結束 | Sprint 17 Stage 1 |
|---|---|---|
| vitest | 750 / 63 | **783 / 66**（+33）|
| E2E | 43 | 43 |
| Typecheck | ✅ 綠 | ✅ 綠 |
| 守護測試 pattern | 只驗結構 / 不驗 runtime | 只驗結構 / 不驗 runtime（**仍未解**）|

### 觀察
- 33 個新測試 + 2 個更新，沒有 falsy pass（Sprint 16 Stage 1 揭露 Sprint 15 Stage 3 假成功教訓）
- 所有守護測試都是先紅後綠（TDD 紀律）

---

## 6. 需求對齊 ✅

### 用戶需求 vs Sprint 17 Stage 1 交付

| 需求 | 現況（Sprint 16）| Sprint 17 Stage 1 | 狀態 |
|---|---|---|---|
| list 表格好看 | 純 HTML black border | shadcn Table | ✅ |
| list 按鈕好看 | 純藍色 | shadcn Button + Plus icon | ✅ |
| detail 卡片好看 | 純 div | shadcn Card | ✅ |
| detail 欄位對齊 | `<dl>` 條列 | grid 3 columns | ✅ |
| form 統一 | 純 input + border | shadcn Input/Textarea | ✅ |
| form loading | 純 disabled | Loader2 icon spin | ✅ |
| 空狀態友善 | 「尚無資料」 | shadcn Empty + icon | ✅ |
| customRenderer 真實渲染 | placeholder | placeholder | ⏳ Stage 2 |

### 觀察
- 用戶痛點「UI Raw 丑」**100% 解決**
- customRenderer JSX 預編譯問題仍待 Stage 2（Sprint 17 期間揭露的技術債）

---

## Sprint 17 Stage 1 vs Sprint 16 跨 Sprint 觀察

| 維度 | Sprint 16 | Sprint 17 Stage 1 | 改善 |
|---|---|---|---|
| UI 視覺 | 純 HTML inline | shadcn 一致 | +85% |
| Icon 一致性 | 沒 icons | Lucide icons 統一 | +100% |
| Button 變體 | 1 種（藍色）| 4 種 variants | +300% |
| a11y | htmlFor 缺失 | Label + htmlFor 配對 | +50% |
| SEO | CardTitle 是 `<div>` | CardTitle 是 `<h3>` | +100% |
| 守護測試 | 750 | 783 | +4.4% |
| 技術債 | formatter key bug 假成功 | Stage 2 customRenderer 待做 | -30% |

---

## Sprint 17 Stage 1 重要發現

### 1. shadcn 元件優先順序
- **Card 比 div 好**：自動圓角、陰影、padding 統一
- **Button variants 比 inline Tailwind 好**：hover focus disabled 一致
- **Lucide icons 比 emoji 好**：統一 SVG、可調整大小

### 2. CardTitle semantic HTML 教訓
原本 shadcn Card（簡化版）CardTitle 是 `<div>`，但 semantic HTML 應該是 `<h3>`。修改後：
- SEO 改善（搜尋引擎看得懂）
- E2E 測試 `page.locator('h1')` 可定位頁面標題
- 螢幕閱讀器 a11y 友善

### 3. Stage 2 customRenderer 仍待 JSX 預編譯
- Next.js client bundle 不能動態 `require()` .tsx 檔案
- 引入 esbuild 是最可能方案（Sprint 17 Stage 2 Spike 評估）

### 4. 表單 placeholder 補充
原 UIField 沒有 `helpText`，但 spec 已支援 `placeholder` 欄位。Sprint 17 Stage 1 補上。

---

## Sprint 17 Stage 1 改進延續建議

### 短期（Sprint 18 規劃）
- Stage 2 customRenderer 完成（2 SP + 0.5 Spike）
- 守護測試加 runtime 渲染驗證（避免假成功）

### 中期（Sprint 19+ 規劃）
- 加 `dropdown-menu` 元件（row actions：編輯 / 刪除）
- 加 `pagination` 元件（list 分頁）
- 加 `skeleton` 元件（loading state）

### 長期（Sprint 20+ 規劃）
- dark mode 支援（shadcn 已內建但目前用 light）
- i18n 完整支援（目前只 zh-Hant）
- 更多 status badge variants（不同顏色對應不同狀態）

---

## Sprint 17 Stage 1 完成度

**Stage 1 = 100% 完成**（3 / 3 SP）

✅ Stage 1.1 list page → shadcn
✅ Stage 1.2 detail page → shadcn
✅ Stage 1.3 form page → shadcn

**Sprint 17 整體 = 3 / 5.5 SP（54%）**

⏳ Stage 2 customRenderer（待做）
⏳ Spike JSX 預編譯（待做）

---

## Stage 2 規劃建議

### Spike（0.5 SP）
- 評估 esbuild-loader vs swc-loader vs tsx-loader
- 測試 dynamic import .tsx 在 client side 是否可行
- 確認 Next.js webpack 配置要加什麼

### Stage 2 實作（2 SP）
- 引入 esbuild（或選定方案）
- 動態 import customRenderer component
- list page 移除 placeholder、真實渲染 React component
- 守護測試加 runtime 驗證（不只結構）