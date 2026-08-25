# Sprint 16 Reflection — list page Server Component + RWD 驗證（partial 2/3 SP）

## Sprint 範圍與目標

| 項目 | 內容 |
|---|---|
| **Sprint 主題** | Runtime Spec 精簡化 + RWD 驗證 |
| **Sprint 目標** | 1) list page 改 Server Component，formatter 完整支援；2) customRenderer 客戶端動態渲染；3) E2E RWD 測試 |
| **原始 SP** | 3 SP（TECH-038a customRenderer + TECH-038b list formatter + TECH-039 RWD E2E）|
| **完成 SP** | **2 / 3 SP**（TECH-038a 留 Sprint 17）|
| **交付 commit** | `e19f370`（Stage 1）|
| **測試基線** | 750 vitest / 64 files + 43 E2E |

---

## 交付成果

### Sprint 16 Stage 1（commit `e19f370`）

**重大架構改變**：
- list page 從 Client Component（useEffect fetch + 渲染）改為 **完整 Server Component**（server side fetch + formatter 預套用 + 渲染）
- 刪除 `dynamic-list-client.tsx`（不再需要）
- 沒有任何 client JS bundle（page 載入更快）

**Sprint 15 Stage 3 的真實 bug 修正**：
- `UIField.formatter` Sprint 15 直接傳 `'{{fn:xxx}}'` raw 字串（應該是純 fnName）
- detail page `formatters[field.formatter]` key 不 match → 看起來「成功」其實是 client side `toLocaleString('zh-TW')` fallback
- Sprint 16 修正後 server side 真實套用 `formatEventTime`：`2030/12/01 18:00`

**新增檔案**：
- `tests/integration/tech-038-list-server-component.test.ts`（10 守護測試）

**修改檔案**：
- `app/admin/crud/[spec]/page.tsx`（+133 行，Server Component）
- `app/admin/crud/[spec]/[id]/page.tsx`（+10 行，key bug fix）
- `app/admin/crud/[spec]/dynamic-list-client.tsx`（**刪除 124 行**）
- `lib/runtime/ui-config.ts`（+13 行，parseFnRef）
- `lib/runtime/extension-loaders.ts`（+25 行，loadCustomRenderers key 對稱 + 檔名候選）

### Sprint 16 Stage 2（E2E RWD 測試）

**新增檔案**：
- `tests/e2e/tech-039-rwd.spec.ts`（14 個 E2E 測試）

**覆蓋範圍**：
- 4 spec（blog / event / todo / order）× 3 viewport（375 / 768 / 1280）= 12 個 case
- 額外 2 個 case：mobile 表格水平捲動、desktop sidebar + 表格同時可見

---

## 6 維度反省

### 1. UX/UI 一致性 ✅ 通過

- **detail page formatter**：Sprint 15 假成功 → Sprint 16 真實 server-side 套用
- **list page formatter**：Sprint 16 首次完整支援（Event 開始/結束時間已格式化為 `2030/12/01 18:00`）
- **4 spec 一致**：blog/event/todo/order 都套用相同 Server Component list pattern
- **customRenderer 誠實標記**：list page customRenderer field 顯示 placeholder + 註明「Sprint 16 Stage 2 才支援」（不再誤導用戶）

### 2. RWD 響應式設計 ✅ 通過

- **4 spec × 3 viewport = 12 case 全部通過**
- mobile (375)：表格可水平捲動、「新增」按鈕可見、檢視連結存在
- tablet (768)：與 mobile 類似但版面稍寬
- desktop (1280)：sidebar 與表格同時可見、版面完整
- Tailwind CSS 自動 RWD（無需額外媒體查詢）

### 3. 技術債 ⚠️ 有風險但有控管

**已消除**：
- ✅ Sprint 15 Stage 3 假成功 bug（UIField.formatter raw string + key mismatch）— Sprint 16 修正
- ✅ Client Component useEffect fetch 帶來的客戶端 fetch flicker + 二次 SSR/CSR 不一致
- ✅ dynamic-list-client.tsx 124 行 client code 完全刪除

**新增但有控管**：
- ⚠️ **customRenderer JSX require 失敗**：Next.js server side `require()` 無法解析 .tsx JSX（SyntaxError）— 留 Sprint 17，需引入預編譯機制（tsx-loader / esbuild）
- ⚠️ **list page customRenderer placeholder**：用戶暫時看不到 capacityBar 進度條（顯示 `[capacityBar]` italic 文字），但不影響其他欄位

**架構決策留下的技術債**：
- list page 完全依賴 server side fetch → 沒有 client side 即時更新（reload 才看到新資料）
- 但符合 admin 列表頁典型行為，**可接受**

### 4. 可維護性 ✅ 通過

- **純函數 + Server Component 架構**：`renderCell(item, field, formatters)` 純函數，無副作用
- **renderCell 三層 fallback 清晰**：`formatter > customRenderer placeholder > 預設`
- **`parseFnRef` 共用**：在 `lib/runtime/extension-loaders.ts` 與 `ui-config.ts` 共用，單一來源
- **`loadFormatters` 與 `loadCustomRenderers` 對稱**：都用 fnName 作 map key、相同檔名候選邏輯

### 5. 測試覆蓋率 ✅ 通過

**Stage 1**：
- 10 個 list page 結構守護測試（tech-038-list-server-component.test.ts）
- 修正 3 個 tech-038-formatters-renderers.test.ts 預期（純 fnName）
- 746 / 63 files 全綠

**Stage 2**：
- 14 個 E2E RWD 測試（tech-039-rwd.spec.ts）
- 43 / 全 E2E 通過（含 29 既有）

**完整測試基線**：
- 750 vitest / 64 files
- 43 Playwright E2E
- Typecheck ✅ 綠

### 6. 需求對齊 ⚠️ 部分達成（partial 2/3 SP）

**達成**：
- ✅ TECH-038b list page formatter 完整支援
- ✅ TECH-039 E2E RWD 測試

**未達成**：
- ❌ TECH-038a customRenderer 客戶端動態渲染（留 Sprint 17）

**Partial 原因**：
- Next.js server side `require()` 無法解析 .tsx JSX
- 解法需引入 JSX 預編譯基礎建設（**超出 Sprint 16 範圍**）
- Sprint 16 務實處理：list page customRenderer 顯示 placeholder + 註明 Sprint 17

**客戶影響**：
- 用戶看 list page 時，capacityBar 顯示 `[capacityBar]` 而非進度條
- 用戶在 detail page 仍可看到完整內容（手寫 page）
- 已在 CHANGELOG / reflection / backlog 誠實標記

---

## 跨 Sprint 觀察（Sprint 14 → 15 → 16）

| 觀察 | Sprint 14 | Sprint 15 | Sprint 16 |
|---|---|---|---|
| **測試盲點** | 缺守護測試 | Sprint 15 Stage 3 守護測試只看 JSON 結構 | Sprint 16 揭露：守護測試也需驗 runtime 真實執行 |
| **架構演進** | Client Component 動態 fetch | 引入 Server Component（detail）+ 移除 client API base | 完整 Server Component（list + detail）+ 修正 Sprint 15 bug |
| **spec.json 角色** | runtime config | 仍是 SoT，但 formatter raw string bug | 真正 SoT（純 fnName 統一介面）|
| **customRenderer 限制** | 不存在 | Sprint 15 揭露：client bundle 不能 require .tsx | Sprint 16 揭露：server side require 也不能解析 JSX |

---

## 學到的教訓

### 教訓 1：守護測試只驗「結構」會漏掉「行為」

Sprint 15 Stage 3 守護測試只驗「`buildDetailUIConfig` 帶了 formatter 欄位」與「format-event-time.ts 檔案存在」，但**沒驗**「detail page runtime 真的呼叫 formatEventTime」。

Sprint 16 修正後，**守護測試必須包含 runtime 執行驗證**（例如手動 dev server 驗證 formatter 套用後的實際輸出）。

### 教訓 2：跨邊界序列化限制需在架構決策時考慮

- Sprint 15 Stage 3 選了「server side 預套用 formatter」的方案，但**實作時傳 raw `{{fn:xxx}}` 字串**（而非解析後的 fnName）
- 這導致 detail page 整套 formatter 機制**沒真實生效**（fallback 補上）

Sprint 16 教訓：**Server / Client 邊界的介面設計需先把 `{{fn:xxx}}` 拆成純 fnName**，確保 client side lookup 能 match。

### 教訓 3：partial 也是有效交付

Sprint 16 原本規劃 3 SP，最後完成 2 SP（partial）。但：
- **完成的 2 SP 是真實有效**（list formatter + RWD E2E）
- **partial 的 1 SP 有清楚原因**（JSX 預編譯基礎建設超出 Sprint 範圍）
- **partial 部分已誠實標記**（placeholder + 註明 + backlog）

Sprint 16 不追求「全部完成」，追求「完成的真實有效 + 未完成的有清楚去向」。

---

## Sprint 17 待做（從 Sprint 16 partial）

| Task | 內容 | SP | 來源 |
|---|---|---|---|
| TECH-038a | customRenderer 客戶端 React component 動態渲染（需 JSX 預編譯基礎建設）| 2 | Sprint 16 Stage 1 留 |
| Spike | JSX 預編譯方案評估（tsx-loader / esbuild / swc）| 0.5 | Sprint 16 揭露 |
| TECH-040 | list page client side 即時更新（Server Actions 或 SWR）— 可選 | 1 | 架構演進 |

---

## 結論

Sprint 16 達成 **partial 2/3 SP**：
- ✅ list page 改 Server Component（架構簡化 + 載入更快）
- ✅ formatter 在 list + detail 都真實套用（修正 Sprint 15 Stage 3 bug）
- ✅ RWD E2E 驗證 4 spec × 3 viewport 全綠
- ⏭️ customRenderer 客戶端動態渲染留 Sprint 17（需 JSX 預編譯基礎建設）

Sprint 16 是「架構演進 + 真實可用性驗證」並重的一次 sprint，揭露 Sprint 15 Stage 3 的真實 bug，是健康的技術債清理。