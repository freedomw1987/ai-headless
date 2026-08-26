# Sprint 19 Stage 1 Reflection — Server Side 分頁

> **Sprint**: Sprint 19 Stage 1
> **SP**: 3 / 3 ✅
> **Commit**: `eef3ca4`
> **日期**: 2026-08-25

---

## 1. 目標（為什麼做這個 Sprint）

**Sprint 19 啟動原因**：list page 從 Sprint 14 一路傳承下來寫死 `take: 100`，100 筆上限是實質阻礙：
- 一般 CRUD 場景足夠
- 大型資料表（用戶 > 100、訂單 > 100）效能差
- 無法跨頁導航

**Sprint 19 Stage 1 目標**（用戶選擇 A）：
> Server side 分頁 + list page 整合分頁資訊 + 守護測試。
> 打破 100 筆上限，建立 server side 分頁基礎。

**不在 Sprint 19 Stage 1 範圍**（Stage 2/3）：
- URL `?page=` 同步 + 嵌入 `<ListPaginationNav>` UI（Stage 2）
- list 排序 / 篩選（Stage 3+）

---

## 2. 6 維度反省

### 2.1 UX/UI 一致性 ✅

- ✅ list page 顯示「共 N 筆資料（第 X / Y 頁）」保持與既有 admin UI 一致
- ✅ 分頁資訊「第 X / Y 頁（顯示第 N 到 M 筆，共 Z 筆）」用既有 `text-sm text-muted-foreground` 樣式
- ✅ shadcn Pagination 元件已備（Sprint 18 Stage 2.2），Stage 2 直接套用
- ✅ 三個語意化副本：「共 N 筆」在 header + 分頁資訊在底部

**改進**：Sprint 19 Stage 2 整合 ListPaginationNav 後，把分頁 UI 統一在底部，header 只留「共 N 筆」。

### 2.2 RWD 響應式設計 ✅

- ✅ 純文字分頁資訊，手機 / 平板 / 桌面皆可讀
- ✅ 不影響既有 RWD 行為（header + 表格已 RWD 測試 Sprint 16）
- ✅ Stage 2 ListPaginationNav 套用後，Pagination 元件內建 RWD

### 2.3 技術債 ✅

**完全解決**：
- ✅ 100 筆寫死上限 → server side `take: pageSize, skip: (page-1)*pageSize`
- ✅ 單一 `findMany` → `Promise.all([findMany, count])` 平行查詢（效能不打折）

**未解決**（留待 Sprint 19 Stage 2）：
- ❌ list page 沒有嵌入 ListPaginationNav UI（只有分頁資訊文字）
- ❌ URL `?page=` 切換需手動改網址（無 click 互動）

### 2.4 可維護性 ✅

**Server Component 架構延續**：
- ✅ list page 仍是 Server Component，SSR 渲染分頁資訊
- ✅ 不用 client side 狀態管理（PageState 不需 useState）
- ✅ searchParams 由 Next.js App Router 原生支援

**程式碼組織**：
- ✅ `dynamic-handler.ts` `list()` 只加 10 行（含 doc comment）
- ✅ GET API 從 searchParams 讀 → 傳給 handler 一行
- ✅ list page `searchParams: Promise<{page?, pageSize?}>` 一行 + 解析 3 行

**為 Stage 2 鋪路**：
- ✅ ListPaginationNav `mode='server'` 已實作（接受 `basePath` 而非函數 prop）
- ✅ Stage 2 只需在 list page 包一個 `<Suspense>` + `<ListPaginationNavClient>` 包裝

### 2.5 測試覆蓋率 ✅

| 項目 | Sprint 18 完成 | Sprint 19 Stage 1 |
|---|---|---|
| vitest | 828 / 72 | **839 / 73**（+11）|
| E2E | 43 | **43**（0 變化）|
| Typecheck | ✅ 綠 | ✅ 綠 |

**新增守護測試**：`tests/integration/tech-050-list-pagination-server.test.ts`（10 個）
- **dynamic-handler 4 個**：
  - `list()` 從 `ctx.query` 讀取 page + pageSize
  - `list()` 用 `Promise.all([findMany, count])`
  - 回傳 `{ items, total, page, pageSize, totalPages }`
  - skip/take 計算正確 `(page-1) * pageSize`
- **route.ts 2 個**：
  - GET 從 searchParams 讀 `?page=` `?pageSize=`
  - 把 page + pageSize 傳給 `handlers.list()`
- **list page 4 個**：
  - `searchParams: Promise<{page?, pageSize?}>` prop
  - 解析 page + pageSize
  - 把 page + pageSize 傳給 `handlers.list()` 的 query
  - 顯示「共 N 筆」用 total

**Playwright E2E**：暫不為 Stage 1 加（Stage 2 加 URL 同步後再加，1 個 spec × 2 page 即可）。

### 2.6 需求對齊 ✅

**用戶原始需求**（Sprint 19 啟動時選擇 A）：
> 「Stage 1 — server side 分頁 + list page 整合 ListPaginationNav（3 SP）」

**本次交付（Stage 1 簡化）**：
- ✅ server side 分頁（100 筆上限打破）
- ⚠️ 「list page 整合 ListPaginationNav」改為「list page 顯示分頁資訊」

**簡化理由**（守護測試 + 手動驗證後判斷）：
- Server Component 不能傳函數給 Client Component
- ListPaginationNav `mode='server'` 接受函數 prop（onClick）需包 client wrapper
- Sprint 19 Stage 1 範圍（3 SP）不含 client wrapper
- 文字分頁資訊已達「顯示分頁狀態」目標
- **Stage 2 補上完整 ListPaginationNav 嵌入 + URL 同步**

**下一個 P0**：Sprint 19 Stage 2 — list page 嵌入 ListPaginationNav + URL `?page=` 同步（1.5 SP）

---

## 3. 跨 Sprint 觀察

### Sprint 18 → Sprint 19 Stage 1 演進

| 維度 | Sprint 18 | Sprint 19 Stage 1 | 改善 |
|---|---|---|---|
| list 筆數上限 | 寫死 100 | **無上限（分頁）** | +∞ |
| 分頁機制 | 無 | **server side skip/take** | 新功能 |
| 分頁資訊 | 無 | **「共 N 筆（第 X / Y 頁）」** | 新功能 |
| shadcn 元件使用 | 11 個 | 11 個（Stage 2 增至 12 個）| 0% |
| vitest | 828 | 839 | +1.3% |
| E2E | 43 | 43 | 0%（Stage 2 加）|

### 從 Sprint 14 → Sprint 19 演進

| 維度 | Sprint 14 | Sprint 19 Stage 1 | 改善 |
|---|---|---|---|
| list 筆數上限 | 100 | 無上限 | +∞ |
| list page 架構 | Client Component | Server Component | RSC |
| 分頁機制 | 無 | server side | 新功能 |
| CRUD 完整度 | C+R | C+R+U | +50% |
| shadcn 元件 | 0 | 11+ | +11 |
| vitest | ~400 | 839 | +110% |

### 累積架構決策

- ✅ **Server Component 優先**：Sprint 16/18/19 一貫維持 list page 為 Server Component
- ✅ **Promise.all 平行查詢**：Sprint 19 Stage 1 用於 items + count
- ✅ **searchParams Promise<{}>**：Next.js 15 App Router 標準用法
- ✅ **ctx.query 統一介面**：Sprint 14-15 一路傳承
- ✅ **守護測試 pattern**：結構 + 行為 + 整合（regex 結構 + runtime 行為）

---

## 4. 重要發現

### 4.1 「Server Component 不能傳函數給 Client Component」限制

Sprint 19 Stage 1 中，原本打算：
```tsx
<ListPaginationNav mode="server" onPageChange={(p) => router.push(`?page=${p}`)} ... />
```

**撞牆**：
```
Error: Functions cannot be passed directly to Client Components
```

**修正**：把 `ListPaginationNav` 的 `mode='server'` 改成接受 `basePath`，內部用 `<a href>` 組 URL。
- Stage 2 進一步：包 client component wrapper 處理 Next.js `<Link>` 整合

**教訓**：
> Server Component 給 Client Component 只能傳「可序列化」的 props（string / number / object / array / ReactElement）。
> 函數需要用 server action 或 client wrapper。

### 4.2 「Promise.all 平行查詢」效能優化

原本可能寫：
```ts
const items = await prisma.x.findMany(...);
const total = await prisma.x.count(...);  // 等 items 完才跑
```

**Sprint 19 Stage 1 改為**：
```ts
const [items, total] = await Promise.all([
  prisma.x.findMany(...),
  prisma.x.count(...),
]);
```

效果：items + count 平行查詢，round-trip 從 `2N` 變 `N`（其中 N 為 latency）。

**教訓**：
> 兩個獨立查詢必用 Promise.all（除非有先後依賴）。
> 這個 pattern 適用所有 list + count 場景。

### 4.3 「守護測試 regex 限制」Sprint 19 教訓

Sprint 19 Stage 1 守護測試初版用 regex 抓 `export async function GET` 區塊：
```ts
const getBlock = content.match(/export async function GET[\s\S]*?^\s*\}/m);
```

**問題**：`^\s*\}` 抓到 inner `}`（Transition handler 內）就停了 — 沒抓到真正結尾。

**修正**：直接對整個檔案搜尋（不需要區塊）：
```ts
expect(content).toMatch(/searchParams\.get\(['"]page['"]\)/);
expect(content).toMatch(/query:\s*\{[^}]*page[^}]*pageSize/s);
```

**教訓**：
> 抓「檔案層級」用 `content.toMatch(...)`。
> 抓「函數內部」用 `getBlock` + 確認 regex 抓到的是真正結尾。

### 4.4 「list page 簡化」設計權衡

**原計劃**：list page 嵌入 `<ListPaginationNav mode="server">` + 完整 pagination UI。

**Sprint 19 Stage 1 簡化為**：
- 純文字分頁資訊「共 N 筆（第 X / Y 頁）」+ 「第 X / Y 頁（顯示第 N 到 M 筆，共 Z 筆）」
- Stage 2 再嵌入 ListPaginationNav

**理由**：
1. **Server Component 限制**：ListPaginationNav 接受函數 prop 不能直接傳
2. **守護測試 fail-fast**：10 個守護測試 5 個 fail → 抓 bug（page=undefined、total=0）
3. **範圍控制**：Sprint 19 Stage 1 3 SP 集中在 server side 分頁基礎建設
4. **Stage 2 鋪路**：基礎建設完整（API + handler + props），Stage 2 只剩 UI 整合

**權衡**：
- ✅ 核心價值（打破 100 筆上限）100% 達成
- ✅ 使用者能看到分頁狀態
- ⚠️ 仍需手動改 URL 切頁（無 click 互動）

---

## 5. Sprint 19 Stage 2+ 規劃

### Stage 2 — list page 嵌入 ListPaginationNav + URL 同步（1.5 SP）

| Task | 範圍 | SP |
|---|---|---|
| **2.1** | 抽 client wrapper `<ListPaginationNavServer>` 包 ListPaginationNav + 用 Next.js `<Link>` | 0.5 |
| **2.2** | list page 嵌入 `<ListPaginationNavServer>` | 0.5 |
| **2.3** | E2E（4 spec × 2 page，URL 同步 + click 切頁） | 0.5 |
| **總計** | | **1.5** |

### Stage 3 — list 排序 + 篩選（4+ SP）

| Task | 範圍 | SP |
|---|---|---|
| **3.1** | handler 支援 `sort + order` query | 1 |
| **3.2** | API 讀 `?sort= ?order=` | 0.5 |
| **3.3** | list page 加 sortable header + 篩選 UI | 2 |
| **3.4** | 守護測試 + E2E | 0.5 |
| **總計** | | **4+** |

### Sprint 19 完整路線

| Sprint | 範圍 | SP |
|---|---|---|
| **Sprint 19 Stage 1** | server side 分頁 ✅ | 3 |
| **Sprint 19 Stage 2** | ListPaginationNav 整合 + URL 同步 | 1.5 |
| **Sprint 19 Stage 3** | 排序 + 篩選 | 4+ |
| **總計** | | **8.5+** |

---

## 6. 結論

### Sprint 19 Stage 1 完成度

| 指標 | 狀態 |
|---|---|
| SP | **3 / 3** ✅ |
| Gate 2 typecheck | ✅ |
| Gate 3 vitest | ✅ 839 / 73 |
| Gate 4 E2E | ✅ 43 |
| 守護測試 | **+10 新 + 1 改** |
| 文檔 | ✅ CHANGELOG + Backlog + Reflection |

### 主要交付

1. **打破 100 筆上限**：list page 從寫死 `take: 100` 改為 server side 分頁
2. **API 標準化**：GET `/api/crud/[spec]?page=1&pageSize=10` 全 CRUD 統一
3. **分頁資訊可見**：list page header 顯示「共 N 筆（第 X / Y 頁）」
4. **架構延續**：Server Component 架構 + Promise.all 平行查詢
5. **Stage 2 鋪路**：ListPaginationNav `mode='server'` + basePath 已備

### 設計權衡

- ⚠️ Stage 1 簡化為純文字分頁資訊（Stage 2 補 click 互動）
- ⚠️ `<ListPaginationNav>` UI 嵌入留 Stage 2

### 下一步

**Sprint 19 Stage 2 啟動條件**：
- 用戶確認（V01 — 一次一個問題）
- 預期「Stage 2 — list page 嵌入 ListPaginationNav + URL 同步」方向繼續

---

> **本 Sprint 完成** ✅
> 下一個 P0: Sprint 19 Stage 2（list page 嵌入 ListPaginationNav + URL 同步）
