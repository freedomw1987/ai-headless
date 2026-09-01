# Sprint 50 Plan Gate — SourcesList 升級 (檔案類型圖示 + 下載)

> **日期**: 2026-09-01
> **Sprint**: Sprint 50
> **狀態**: ✅ Plan Gate 完成
> **決策**: **方案 A1: 檔案類型圖示 + 下載按鈕** (0.8 SP, 1 commit)
> **範圍**: 0 新功能延伸 (SourcesList 已存在, 從 Sprint 47 帶下第 4 次)

---

## §1 為什麼是 Sprint 50？

**SourcesList 帶下歷史**:

| Sprint | 狀態 | 動作 |
|---|---|---|
| Sprint 47 | 引入 | Sprint 47-1 (Stage 47-1) 建立附件引用折疊區 |
| Sprint 47 | 帶下 1 | 計畫升級為 RAG-style Sources (未做) |
| Sprint 48 | 帶下 2 | Plan Gate Q1 答應做, 未做 (Office Rest 優先) |
| Sprint 49 | 帶下 3 | Plan Gate 排除 (方案 A 純技術債) |
| **Sprint 50** | **升級** | **A1 方案: 檔案類型圖示 + 下載按鈕** |

**Sprint 49 reflection §8 明確建議**: 「Sprint 50 可考慮 SourcesList 升級 (P2, 2 SP)」

---

## §2 Sprint 50 範圍 (4 個 FR / 1 commit / 0.8 SP)

### FR-17: SourcesList 檔案類型圖示 + 下載按鈕 (Stage 50-0)

| FR | 描述 | 優先 | SP |
|----|------|------|-----|
| **FR-17.1** | 加 5 種檔案類型 icon 區分 (PDF/DOCX/XLSX/PPTX/圖片/純文字/未分類) | P2 | 0.2 |
| **FR-17.2** | 加檔案類型標籤 (顯示「MIME 友好名」如「PDF 文件」) | P2 | 0.1 |
| **FR-17.3** | 加下載按鈕 (點擊下載到本機) | P2 | 0.3 |
| **FR-17.4** | 建立下載 API `/api/admin/chat/attachments/[id]/download` (RBAC + session ownership 守衛) | P2 | 0.2 |
| **總計** | **4 FR** | | **0.8 SP** |

### FR-17.1 實作細節: 檔案類型 icon 區分

```typescript
// helpers/attachment-icon.ts
function getAttachmentIcon(mimeType: string): LucideIcon {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType === 'application/pdf') return FileTextIcon;
  if (mimeType.includes('word') || mimeType.includes('document')) return FileTextIcon;
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return SheetIcon;
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return PresentationIcon;
  if (mimeType.startsWith('text/')) return FileTextIcon;
  return FileIcon; // fallback
}
```

從 `lucide-react` 選 icon (已裝):
- `ImageIcon` — 圖片 (jpg/png/webp/gif)
- `FileTextIcon` — PDF/DOCX/TXT
- `SheetIcon` — XLSX
- `PresentationIcon` — PPTX
- `FileIcon` — 未分類

### FR-17.2 實作細節: MIME 友好名

```typescript
const MIME_LABELS: Record<string, string> = {
  'application/pdf': 'PDF 文件',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word 文件',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel 表格',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint 簡報',
  'image/jpeg': 'JPEG 圖片',
  'image/png': 'PNG 圖片',
  'image/gif': 'GIF 圖片',
  'image/webp': 'WebP 圖片',
  'text/plain': '純文字',
  'text/csv': 'CSV 表格',
  'text/markdown': 'Markdown',
};
```

### FR-17.3 實作細節: 下載按鈕

```typescript
// 在 SourcesList 內每個附件加 <DownloadIcon> 按鈕
<a href={`/api/admin/chat/attachments/${att.id}/download`} download>
  <DownloadIcon className="size-3" />
</a>
```

**為什麼用 `<a download>` 而非 `fetch` + Blob**:
- 瀏覽器原生支援, 不需 JS
- 對大檔更友善 (10MB 不會吃記憶體)
- 與 RBAC redirect 機制更相容 (401/403 自動跳轉)

### FR-17.4 實作細節: 下載 API

```ts
// app/api/admin/chat/attachments/[id]/download/route.ts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. RBAC 雙層守衛 (對齊 upload route)
  const user = await requireUser().catch(() => null);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await isAdmin())) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  // 2. 讀 attachment
  const { id } = await params;
  const attachment = await db.attachment.findUnique({ where: { id } });
  if (!attachment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // 3. 驗證 session 歸屬
  await requireSessionOwnership(attachment.sessionId, user.id);

  // 4. 讀檔案
  const filePath = join(process.cwd(), attachment.storagePath);
  const buffer = await readFile(filePath);

  // 5. 回傳 (含 Content-Disposition 強制下載)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': attachment.mimeType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(attachment.filename)}"`,
      'Content-Length': attachment.size.toString(),
    },
  });
}
```

**RBAC + session ownership + 404 三層守衛** (對齊 upload route Sprint 48-3 重構)。

---

## §3 守護測試計畫

### 既有 SourcesList 測試 (Sprint 47-1, 5 tests)

| Test | 預期 |
|---|---|
| 預設收合, 點擊展開 | ✅ 保留 |
| attachments 空陣列不渲染 | ✅ 保留 |
| attachments undefined 不渲染 | ✅ 保留 |
| 顯示檔名 + 大小 | ✅ 保留 |
| 鍵盤可達 | ✅ 保留 |

### 新增守護測試 (Sprint 50, 預估 +10 tests)

| Test | 內容 |
|---|---|
| `image/png` icon | 顯示 `ImageIcon` class |
| `application/pdf` icon | 顯示 `FileTextIcon` class |
| XLSX icon | 顯示 `SheetIcon` class |
| PPTX icon | 顯示 `PresentationIcon` class |
| 未分類 mimeType | 顯示 fallback `FileIcon` |
| MIME 標籤 | PDF 顯示「PDF 文件」 |
| 下載按鈕存在 | 每個附件都有 DownloadIcon |
| 下載按鈕 href | 指向 `/api/admin/chat/attachments/{id}/download` |
| 下載 API RBAC | 未登入 → 401 |
| 下載 API session ownership | 跨 session → 403 |
| 下載 API 404 | 不存在 id → 404 |
| 下載 API 成功 | 正確回傳檔案 + Content-Disposition |

---

## §4 4 Gate SOP 執行計畫

### Gate 1: TDD gate

- 先寫守護測試 (預估 10 tests)
- 跑測試 → 紅燈 (SourcesList 沒圖示/下載功能, API 不存在)
- 實作 → 綠燈

### Gate 2: lint / syntax gate

- `pnpm lint` + `pnpm typecheck`
- 0 error

### Gate 3: regression gate

- `pnpm test` 全綠
- 預估 1956 → ~1968 tests (+12)

### Gate 4: reviewer gate

- 用 `dev-checker-loop` skill 校驗
- 重點檢查: RBAC 守衛完整 / session ownership 沒漏 / MIME 白名單沿用

---

## §5 明確排除 (Sprint 50 不做)

| 項目 | 排除原因 | 帶下 |
|---|---|---|
| 圖片 inline preview | 屬於方案 A2 (Sprint 50 採 A1) | Sprint 51+ (若用戶選) |
| 全文預覽 | 屬於方案 A2 | Sprint 51+ |
| 批次下載 (zip) | 屬於方案 A3 | Sprint 51+ |
| 檔案類型 icon tooltip | 屬於「外觀增強」非核心功能 | Sprint 51+ |
| OCR 圖片內容 | 屬於 Sprint 47-4 PDF parser 升級 | Sprint 50+ 後 |

---

## §6 風險與緩解

### 風險 1: 下載 API RBAC 漏洞

- **嚴重性**: 🟡 中
- **理由**: 下載是 GET 路由, 容易被誤設為公開
- **緩解**:
  - 沿用 upload route 的 RBAC + session ownership pattern (Sprint 48-3 重構)
  - 加守護測試: 未登入 → 401, 跨 session → 403, 不存在 → 404
  - Code review 重點

### 風險 2: 檔案系統路徑穿越攻擊

- **嚴重性**: 🟡 中
- **理由**: `storagePath` 雖由 server 寫入, 但若被污染可能讀到任意檔案
- **緩解**:
  - 不直接信任 `attachment.storagePath`
  - 從 DB 讀 `storagePath`, 拼湊為絕對路徑, 並驗證 `path.startsWith(UPLOAD_ROOT)`
  - 守護測試加 path traversal case

### 風險 3: 大檔下載記憶體吃緊

- **嚴重性**: 🟢 低
- **理由**: 附件上限 10MB, NextResponse buffer 處理沒問題
- **緩解**: 上限由 mime-validator 守護 (Sprint 46 Stage 46-A)

### 風險 4: 中文檔名 Content-Disposition 編碼問題

- **嚴重性**: 🟡 中
- **理由**: 瀏覽器對中文檔名編碼處理不一致
- **緩解**:
  - 用 `encodeURIComponent` 包裹
  - 用 `filename*=UTF-8''...` 雙編碼 (RFC 5987)
  - 守護測試加中文檔名 case

---

## §7 Sprint 累積表

| Sprint | FR 數 | SP | 累積 FR | 累積 SP |
|---|---|---|---|---|
| 47 | 37 | 14 | 37 | 14 |
| 48 | 15 | 4.8 | 52 | 18.8 |
| 49 | 9 | 0.8 | 61 | 19.6 |
| **50** | **4** | **0.8** | **65** | **20.4** |

**Sprint 50 範圍**: 純延伸既有 SourcesList 元件 (1 commit), 0 風險擴張。

---

## §8 Plan Gate 決策記錄

### Q1: Sprint 50 主題?

- A. SourcesList 升級 ← **採用**
- B. CRUD List 增強
- C. 繼續技術債清理

### Q2: SourcesList 升級方向?

- A1. 檔案類型圖示 + 下載按鈕 ← **採用**
- A2. 圖片 inline preview
- A3. A1 + A2 全部

### Q3: 範圍細節確認?

- 4 FR / 0.8 SP / 1 commit ← **採用**

---

## §9 下一步

1. ✅ Plan Gate 完成 (本文件)
2. → Design Gate: 擴充 PRD §2.12 FR-17
3. Stage 50-0: 實作 (1 commit)
4. Submit Gate: reflection + backlog

---

**Plan Gate 結束時間**: 2026-09-01
**Sprint 50 commits**: 1 (預估)
**Sprint 50 SP**: 0.8 (預估)
**下一個 gate**: Sprint 50 Design Gate