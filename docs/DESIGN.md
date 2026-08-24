---
# DESIGN.md — ai-headless Design System
# 給 AI Coding Agent 用的視覺設計規範
# 規範來源: https://stitch.withgoogle.com/docs/design-md/specification/

name: ai-headless Design System
version: 1.0.0
description: >
  WordPress 風格的 AI Headless CRUD 框架的視覺設計語言。
  設計理念：現代簡約、專業可靠、高密度、易擴展。
  所有 AI 生成的 UI 必須遵循本設計。

# ────────── Colors ──────────
colors:
  # 品牌色（Slate 系列，專業、可靠）
  primary:
    50: "#F8FAFC"
    100: "#F1F5F9"
    200: "#E2E8F0"
    300: "#CBD5E1"
    400: "#94A3B8"
    500: "#64748B"
    600: "#475569"
    700: "#334155"
    800: "#1E293B"
    900: "#0F172A"
    950: "#020617"
  # 強調色（Indigo，用於關鍵 CTA、AI 高亮）
  accent:
    50: "#EEF2FF"
    100: "#E0E7FF"
    200: "#C7D2FE"
    300: "#A5B4FC"
    400: "#818CF8"
    500: "#6366F1"
    600: "#4F46E5"
    700: "#4338CA"
    800: "#3730A3"
    900: "#312E81"
  # 語意色
  success:
    50: "#F0FDF4"
    500: "#22C55E"
    700: "#15803D"
  warning:
    50: "#FFFBEB"
    500: "#F59E0B"
    700: "#B45309"
  danger:
    50: "#FEF2F2"
    500: "#EF4444"
    700: "#B91C1C"
  info:
    50: "#EFF6FF"
    500: "#3B82F6"
    700: "#1D4ED8"

# ────────── Typography ──────────
typography:
  fontFamily:
    sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace"
  fontSize:
    xs: "0.75rem"      # 12px - 標籤、輔助文字
    sm: "0.875rem"     # 14px - 表格、輔助
    base: "1rem"       # 16px - 內文
    lg: "1.125rem"     # 18px - 卡片標題
    xl: "1.25rem"      # 20px - 章節標題
    "2xl": "1.5rem"    # 24px - 頁面標題
    "3xl": "1.875rem"  # 30px - 大標題
    "4xl": "2.25rem"   # 36px - Hero
  fontWeight:
    normal: 400
    medium: 500
    semibold: 600
    bold: 700
  lineHeight:
    tight: 1.25
    normal: 1.5
    relaxed: 1.75

# ────────── Spacing ──────────
spacing:
  unit: 4                 # base unit = 4px
  scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64]
  # Tailwind 對應: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128, 160, 192, 256
  semantic:
    xs: "0.25rem"    # 4px
    sm: "0.5rem"     # 8px
    md: "1rem"       # 16px
    lg: "1.5rem"     # 24px
    xl: "2rem"       # 32px
    "2xl": "3rem"    # 48px
    "3xl": "4rem"    # 64px

# ────────── Border Radius ──────────
borderRadius:
  none: "0"
  sm: "0.25rem"      # 4px - checkbox, tag
  md: "0.5rem"       # 8px - button, input
  lg: "0.75rem"      # 12px - card
  xl: "1rem"         # 16px - modal
  full: "9999px"     # avatar, badge

# ────────── Shadow ──────────
shadows:
  none: "none"
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)"
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)"
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"

# ────────── Layout ──────────
layout:
  breakpoints:
    sm: "640px"
    md: "768px"
    lg: "1024px"
    xl: "1280px"
    "2xl": "1536px"
  sidebar:
    width: "16rem"       # 256px - 後台側邊欄
    widthCollapsed: "4rem" # 64px - 收合狀態
  header:
    height: "4rem"        # 64px
  maxWidth:
    content: "1280px"    # 內容最大寬度
    prose: "720px"       # 文章正文寬度

# ────────── Animation ──────────
animation:
  duration:
    fast: "150ms"
    normal: "250ms"
    slow: "350ms"
  easing:
    ease: "cubic-bezier(0.4, 0, 0.2, 1)"
    easeIn: "cubic-bezier(0.4, 0, 1, 1)"
    easeOut: "cubic-bezier(0, 0, 0.2, 1)"
---

# ai-headless Design System

> 給 AI Coding Agent 使用的視覺設計規範。
> 所有 AI 生成的 UI 組件必須遵循本設計語言。

---

## 1. 設計理念（Design Rationale）

### 1.1 一句話描述

**「現代簡約、專業可靠的後台工作空間」** —— 為長時間使用的管理員設計，高密度但不擁擠，簡潔但不單調。

### 1.2 核心原則

1. **Content First（內容優先）**：UI 是內容的容器，不搶內容的注意力
2. **High Density（高密度）**：後台用戶需要看到大量數據，不浪費任何像素
3. **Subtle Hierarchy（細微層次）**：用留白、字重、顏色深淺區分層次，不用花俏裝飾
4. **Consistent Rhythm（一貫節奏）**：4px 基數網格，所有元素對齊
5. **Predictable Motion（可預期動畫）**：動畫只用於狀態變化，不為動畫而動畫

### 1.3 為什麼不用花俏設計？

這是一個**生產力工具**，不是行銷頁面。用戶每天用 8 小時，太花俏會：
- 分散注意力
- 視覺疲勞
- AI 生成時容易出錯（細節太多）

---

## 2. 顏色系統（Color System）

### 2.1 主色（Primary — Slate）

**用途**：文字、邊框、次要按鈕、側邊欄背景

| Token | Hex | 用途 |
|---|---|---|
| `primary-50` | #F8FAFC | 頁面背景 |
| `primary-100` | #F1F5F9 | 卡片背景、輸入框 |
| `primary-500` | #64748B | 輔助文字、icon |
| `primary-700` | #334155 | 次要按鈕 |
| `primary-900` | #0F172A | 主要文字 |

### 2.2 強調色（Accent — Indigo）

**用途**：主要 CTA、AI 高亮、活躍狀態

| Token | Hex | 用途 |
|---|---|---|
| `accent-500` | #6366F1 | 主要按鈕背景 |
| `accent-600` | #4F46E5 | 按鈕 hover |
| `accent-100` | #E0E7FF | 活躍狀態背景 |

> 💡 AI 生成提示：當用戶說「主要按鈕」「CTA」時，用 `accent-500`。

### 2.3 語意色（Semantic）

| 語意 | 主用 Token | 場景 |
|---|---|---|
| **Success** | `success-500` (#22C55E) | 成功訊息、完成狀態 |
| **Warning** | `warning-500` (#F59E0B) | 警告、即將過期 |
| **Danger** | `danger-500` (#EF4444) | 錯誤、刪除操作 |
| **Info** | `info-500` (#3B82F6) | 提示、幫助連結 |

### 2.4 顏色使用規範

1. **絕對規則**：
   - ❌ 不要用純黑（`#000`）—— 用 `primary-900`
   - ❌ 不要用純白（`#FFF`）—— 用 `primary-50` 或 `#FFFFFF`（只在卡片內）
   - ✅ 灰階永遠用 Slate 系列（不要用 Gray / Zinc）

2. **對比度**：
   - 文字 vs 背景 ≥ 4.5:1（WCAG AA）
   - 主要文字用 `primary-900` on `primary-50`
   - 輔助文字用 `primary-500` on `primary-50`

---

## 3. 字體系統（Typography）

### 3.1 字體選擇

| 用途 | 字體 | 理由 |
|---|---|---|
| **UI / 內文** | **Inter** | 開源、現代替代系統字體、letter-spacing 適合高密度 UI |
| **代碼 / JSON** | **JetBrains Mono** | 等寬、清晰、編程友善 |

### 3.2 字體階梯

```
H1 (Hero)         text-4xl  (36px)  font-bold     line-height: tight
H2 (頁面標題)     text-3xl  (30px)  font-bold     line-height: tight
H3 (章節)         text-2xl  (24px)  font-semibold line-height: tight
H4 (卡片標題)     text-xl   (20px)  font-semibold line-height: tight
H5 (子章節)       text-lg   (18px)  font-medium   line-height: normal
Body              text-base (16px)  font-normal   line-height: normal
Small             text-sm   (14px)  font-normal   line-height: normal
Caption           text-xs   (12px)  font-medium   line-height: normal
Code              text-sm   (14px)  font-mono     (JetBrains Mono)
```

### 3.3 字體使用規範

1. **永遠用 Tailwind class**：不要寫 inline style
2. **標題用 `font-semibold` 或 `font-bold`**：不要用 `font-extrabold`
3. **中文**：Inter 包含部分中文，但建議 fallback 用系統字體
4. **JSON / 代碼**：永遠用 `font-mono`

---

## 4. 間距系統（Spacing）

### 4.1 4px 基數網格

所有元素間距必須是 4px 的倍數：

| Token | 值 | 常用場景 |
|---|---|---|
| `spacing-1` | 4px | icon 與文字間距 |
| `spacing-2` | 8px | 表單元素內距 |
| `spacing-3` | 12px | 按鈕 padding |
| `spacing-4` | 16px | 卡片內距 |
| `spacing-6` | 24px | 章節間距 |
| `spacing-8` | 32px | 頁面區塊間距 |

### 4.2 間距規範

1. **頁面 padding**：左右 `px-4 md:px-6 lg:px-8`
2. **卡片 padding**：`p-4 md:p-6`
3. **按鈕 padding y軸**：`py-2`（8px）；`py-3`（12px）用在主要 CTA
4. **表單元素間距**：`space-y-4`
5. **表格 cell padding**：`px-4 py-3`

---

## 5. 圓角與陰影

### 5.1 圓角（Border Radius）

| Token | 值 | 用途 |
|---|---|---|
| `rounded-sm` | 4px | checkbox, tag |
| `rounded-md` | 8px | **button, input**（最常用）|
| `rounded-lg` | 12px | **card** |
| `rounded-xl` | 16px | modal |

> 💡 預設用 `rounded-md`（按鈕、輸入框）和 `rounded-lg`（卡片）。

### 5.2 陰影（Shadow）

只用於「浮起」的元素：

| Token | 用途 |
|---|---|
| `shadow-sm` | dropdown、tooltip |
| `shadow-md` | **card**（默認） |
| `shadow-lg` | modal、popover |
| `shadow-xl` | 浮層最上層 |

> ❌ 不要給所有元素加陰影，只在「浮起」時用。

---

## 6. 組件風格（Component Stylings）

### 6.1 按鈕（Button）

```
主要按鈕：
  bg: accent-500    text: white       hover: accent-600
  px-4 py-2         rounded-md        font-medium
  shadow-sm

次要按鈕：
  bg: primary-100   text: primary-900  hover: primary-200
  border: 1px primary-200
  px-4 py-2         rounded-md        font-medium

危險按鈕：
  bg: danger-500    text: white        hover: danger-700
  px-4 py-2         rounded-md        font-medium
```

### 6.2 輸入框（Input）

```
  bg: white          border: 1px primary-200
  px-3 py-2          rounded-md        text: primary-900
  focus: ring-2 ring-accent-500 border-accent-500
  placeholder: primary-400
```

### 6.3 卡片（Card）

```
  bg: white          shadow-md         border: 1px primary-200
  rounded-lg         p-4 md:p-6
```

### 6.4 表格（Table）

```
  Header: bg primary-50     text primary-700     font-medium   text-sm
  Row:    border-b primary-100      hover: bg primary-50
  Cell:   px-4 py-3   text-sm
```

### 6.5 標籤（Badge）

```
  bg: primary-100    text: primary-700   rounded-full   px-2.5 py-0.5   text-xs font-medium
  Success variant: bg success-50    text success-700
  Warning variant: bg warning-50    text warning-700
  Danger variant:  bg danger-50     text danger-700
```

---

## 7. 佈局原則（Layout Principles）

### 7.1 後台佈局

```
┌─────────────────────────────────────────────────┐
│  Header (h-16)                                  │
├──────────┬──────────────────────────────────────┤
│          │                                       │
│ Sidebar  │   Main Content (p-6)                 │
│ (w-64)   │                                       │
│          │   ┌─────────────────────────────┐   │
│          │   │  Page Title + Actions        │   │
│          │   ├─────────────────────────────┤   │
│          │   │  Card / Table / Form        │   │
│          │   │                              │   │
│          │   └─────────────────────────────┘   │
│          │                                       │
└──────────┴──────────────────────────────────────┘
```

### 7.2 主要頁面模式

| 頁面類型 | 結構 |
|---|---|
| **列表頁** | Header + Filter Bar + Data Table + Pagination |
| **詳情頁** | Header + Tabs + Content Sections + Side Actions |
| **表單頁** | Header + Form Sections + Submit Button (sticky bottom) |
| **AI Chat** | Full-height chat window，無 sidebar |

### 7.3 響應式斷點

- **Mobile (< 768px)**：Sidebar 變成 drawer，Table 變 Card List
- **Tablet (768-1024px)**：Sidebar 可收合
- **Desktop (> 1024px)**：完整 sidebar + 主內容

---

## 8. AI 生成 UI 的規範（給 AI 看的）

### 8.1 AI 必須遵守的硬規則

1. **永遠使用 Tailwind class**，不要寫 CSS modules / inline style
2. **永遠用 `cn()` 合併 class**，不要字串拼接
3. **shadcn/ui 優先**：能用現成組件就用，AI 自己寫的組件風格要跟 shadcn 一致
4. **icon 用 lucide-react**，統一 icon 庫
5. **必須響應式**：每個組件都要考慮 mobile 場景

### 8.2 AI 必須輸出的 metadata

每個 AI 生成的組件，必須在頂部註解說明：
- 對應的 JSON Spec 欄位
- 對應的 shadcn/ui 組件（如有）
- 設計 token 來源

範例：
```tsx
/**
 * Auto-generated by ai-headless JSON Compiler
 * Source: JSON Spec → ui.list.columns[*]
 * Components: shadcn/ui Table + TanStack Table
 * Tokens: spacing-4, text-sm, rounded-md
 */
```

### 8.3 顏色選擇決策樹

```
用戶要按鈕？        → 主要 CTA → accent-500
                       次要      → primary-100
                       危險      → danger-500
用戶要文字？        → 主要      → primary-900
                       輔助      → primary-500
                       連結      → accent-600
用戶要背景？        → 頁面      → primary-50
                       卡片      → white
用戶要狀態？        → 成功      → success-50/500/700
                       警告      → warning-50/500/700
                       錯誤      → danger-50/500/700
```

---

## 9. 動畫原則

### 9.1 動畫使用場景

| 場景 | 動畫 |
|---|---|
| **頁面切換** | 不動畫（避免延遲感） |
| **Modal 開啟** | fade + scale，duration 250ms |
| **Dropdown 開啟** | fade + slide-down，duration 150ms |
| **Toast** | slide-in from right，duration 250ms |
| **Loading** | spinner 或 skeleton，不要自創 |
| **AI Streaming** | 文字逐字顯示（typewriter effect），duration 自然 |

### 9.2 動畫規範

1. **只用 transform / opacity**，避免 layout thrashing
2. **duration ≤ 350ms**，太長會煩躁
3. **不要加進場動畫**給所有元素，會拖慢頁面

---

## 10. 無障礙（Accessibility）

1. **色彩對比**：所有文字 vs 背景 ≥ 4.5:1
2. **鍵盤導航**：所有互動元素可用 Tab 訪問
3. **focus ring**：永遠顯示 `focus-visible:ring-2`
4. **aria-label**：icon-only 按鈕必須有 aria-label
5. **form label**：每個 input 必須有 label

---

## 11. 文案規範

### 11.1 語氣

- **簡潔直接**：不要「您可以...」這種委婉，直接「點擊這裡」
- **動作導向**：按鈕文字用動詞「新增」「刪除」「儲存」
- **避免術語**：用戶面向的文字不要寫「CRUD」「JSON」

### 11.2 中英文

| 情境 | 語言 |
|---|---|
| **按鈕 / 標籤** | 繁體中文（zh-Hant） |
| **錯誤訊息** | 繁體中文 |
| **代碼註解 / 變量名** | 英文 |
| **文檔（docs/）** | 繁體中文 |

> AI 生成繁體中文文案時，請用「您」以外的稱呼（這是台灣軟體慣例）。

---

## 12. 反模式（Anti-patterns）

❌ **禁止做的事**：

1. ❌ 用 emoji 當 UI icon（除非用戶明確要求）
2. ❌ 用漸層背景（除 Hero 區）
3. ❌ 把所有元素都做成圓形 / 超大圓角
4. ❌ 文字用 italic（中文 italic 很醜）
5. ❌ 陰影用 `shadow-2xl` 或更大（太重）
6. ❌ 字體大小超過 `text-4xl`（除 Hero）
7. ❌ 用 `text-gray-*`，必須用 `text-primary-*`
8. ❌ 任意自創顏色（必須從 palette 選）

---

## 13. 範例：完整頁面

### 列表頁（Users）

```tsx
<div className="p-6 space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-bold text-primary-900">用戶管理</h1>
    <Button className="bg-accent-500 hover:bg-accent-600">
      <Plus className="w-4 h-4 mr-2" />
      新增用戶
    </Button>
  </div>

  {/* Filter Bar */}
  <Card className="p-4">
    <div className="flex gap-2">
      <Input placeholder="搜尋用戶..." className="max-w-sm" />
      <Select>...</Select>
    </div>
  </Card>

  {/* Table */}
  <Card>
    <Table>
      <TableHeader className="bg-primary-50">
        <TableRow>
          <TableHead className="text-primary-700">姓名</TableHead>
          <TableHead className="text-primary-700">Email</TableHead>
          <TableHead className="text-primary-700">角色</TableHead>
          <TableHead className="text-primary-700">狀態</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        ...
      </TableBody>
    </Table>
  </Card>
</div>
```

---

**相關文檔**：
- 🏗️ [系統架構](./system-design.md)
- 📝 [JSON 功能規範](./specs/json-spec.md)
- 🔌 [Extension 開發規範](./specs/extension-spec.md)