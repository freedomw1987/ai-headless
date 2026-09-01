# Sprint 50 Reflection — SourcesList 升級

> **Sprint**: Sprint 50
> **日期**: 2026-09-01
> **狀態**: ✅ 完成
> **Plan Gate**: [docs/sprint50-plan-gate.md](../sprint50-plan-gate.md)
> **帶下項目**: 從 Sprint 47 帶下第 4 次, Sprint 49 reflection §8 明確建議

---

## §1 Sprint 50 目標達成狀況

### Plan Gate 預估 vs 實際

| 項目 | 預估 | 實際 |
|---|---|---|
| Commits | 1 | 1 ✅ |
| FR | 4 | 4 ✅ |
| SP | 0.8 | 0.8 ✅ |
| 新功能 | 1 個 (SourcesList v2) | 1 個 ✅ |
| 守護測試 | +10 ~ 12 | +23 (超預期 +11) |

### Commit 序列

```
f8314fd docs(sprint-50): Plan Gate (SourcesList 升級 A1)
24a1ada docs(sprint-50): Design Gate (FR-17.1 ~ FR-17.4)
9c3aaea feat(sprint-50-0): SourcesList 升級 (檔案類型圖示 + 下載按鈕 + 下載 API)
```

### 測試基線演進

| Sprint | Files | Tests |
|---|---|---|
| Sprint 49-2 結尾 | 207 | 1956 |
| **Sprint 50-0 結尾** | **209** | **1979 (+23)** |

---

## §2 Stage 50-0 (SourcesList v2 升級) 反思

### 達成

- FR-17.1: 5 種檔案類型 icon (FileImage/FileText/FileSpreadsheet/Presentation/File fallback)
- FR-17.2: 11 種 MIME 友好標籤 (PDF 文件 / Excel 表格 / PowerPoint 簡報 / JPEG 圖片 / ...)
- FR-17.3: 每個附件加 `<a download>` 下載按鈕, 瀏覽器原生支援
- FR-17.4: 下載 API `/api/admin/chat/attachments/[id]/download` 完整實作

### 學習

- **lucide-react icon 名稱實際檢查**: Plan Gate 寫 `ImageIcon`/`SheetIcon`, 但實際是 `FileImageIcon`/`FileSpreadsheetIcon`。Plan Gate 時若先 ls 確認, 可避免實作時修正
- **vitest glob 對 Next.js dynamic route `[id]` 處理限制**: 守護測試原本放在 `app/api/admin/chat/attachments/[id]/download/route.test.ts`, vitest 找不到。後改放 `tests/` 下, 與 office-parser-rest-guard 風格一致
- **既有 SourcesList test 全部保留**: 5 個 Sprint 47-1 測試仍綠, 證明向後相容沒被破壞
- **`<a download>` vs `fetch`+Blob**: 選前者因瀏覽器原生, 對 10MB 大檔更友善, 與 RBAC redirect 相容

### 意外發現

- **守護測試數量超預期**: 預估 +10 ~ 12, 實際 +23 (+11)。原因是把既有功能 (預設收合、空 attachments) 也加進 v2 test, 形成完整覆蓋
- **檔案系統守護比 runtime 測試更可靠**: download API 守護測試是檔案結構驗證 (與 stream route.test.ts 風格一致), 無需 mock DB/auth, 但能抓到 RBAC 漏洞、path traversal 缺失

---

## §3 安全設計反思

### 3.1 RBAC 三層守衛完整

```
requireUser() → 401 (未登入)
↓
isAdmin() → 403 (非 admin)
↓
requireSessionOwnership() → 403 (跨 session)
↓
404 (attachment 不存在)
↓
filePath.startsWith(UPLOAD_ROOT) → 500 (path traversal)
```

對齊 upload route Sprint 48-3 重構 pattern, 程式碼風格一致。

### 3.2 中文檔名 RFC 5987 雙編碼

```typescript
`attachment; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`
```

- Chrome/Firefox/Safari 都相容
- 對齊 RFC 5987 標準
- Sprint 47-3 上傳時未做 (upload 不需中文檔名 header), Sprint 50-0 下載時補上

### 3.3 path traversal 防護

```typescript
const filePath = join(process.cwd(), attachment.storagePath);
if (!filePath.startsWith(UPLOAD_ROOT)) {
  return NextResponse.json({ error: 'Invalid path' }, { status: 500 });
}
```

- 即使 `attachment.storagePath` 被污染 (例如 `/etc/passwd`), `filePath.startsWith(UPLOAD_ROOT)` 會擋下
- 這是「defense in depth」: attachment.storagePath 由 upload route 寫入時已是 `uploads/<sessionId>/<uuid>.<ext>`, 但仍做二次驗證

---

## §4 Sprint 50 vs Sprint 49 對比

| 維度 | Sprint 49 | Sprint 50 |
|---|---|---|
| 主題 | 純技術債清理 | 新功能升級 (SourcesList v2) |
| 新功能 | 0 | 1 (既有元件升級) |
| Commits | 3 | 1 |
| SP | 0.8 | 0.8 |
| 守護測試 | +18 | +23 |
| 風險 | 🟢 極低 (純內部 refactor) | 🟢 低 (RBAC 三層 + path traversal + 中文編碼) |
| UI 改動 | 無 | 有 (icon + 標籤 + 下載按鈕) |

---

## §5 Sprint 51+ 帶下項目

### 從 Sprint 47 ~ 50 累積待處理

| 來源 | 項目 | 優先 | 預估 SP |
|---|---|---|---|
| Sprint 47 | ~~US-S50-SourcesList~~ (本 Sprint 已升級為 v2) | — | — |
| Sprint 48 | TD-S48-CRUDListEnhancements (CRUD List 增強) | P2 | 5 SP |
| Sprint 50 (新) | **SourcesList v3** (A2 圖片 inline preview) | P3 | 1.2 SP |
| Sprint 50 (新) | **SourcesList v3+** (A3 v2 + v3 全做) | P3 | 2 SP |
| Sprint 49 | 其他 SDK type dep 切斷 (`Message` 等) | P3 | TBD |

### 排除項目（明確不做）

- ❌ SourcesList v1 → v3 升級一次完成 (A3 全做) — 範圍過大, 分階段
- ❌ OCR 圖片內容解析
- ❌ 批次下載 zip

---

## §6 對 SOP 的反思

### SOP §2.3 4 Gate 表現

- **Gate 1 TDD**: Sprint 50-0 紅→綠 cycle 揭露 8 個違規 (icon + 標籤 + 下載按鈕), 證明守護測試是真實斷言
- **Gate 2 Lint+Typecheck**: 0 error (`getAttachmentIcon` 回傳 `LucideIcon` union type 自動驗證相容)
- **Gate 3 Regression**: 1979 tests / 27 秒, 略短於 Sprint 49 (因 sprint 範圍小)
- **Gate 4 Reviewer**: 守護測試不只驗證 happy path, 還驗證 RBAC/path traversal/中文編碼

### 對 SOP 的建議

1. **Plan Gate 寫程式碼前先 ls 套件內部**: 寫 PRD 時若涉及第三方 icon, 先 `ls node_modules/lucide-react/dist/esm/icons/` 確認實際名稱, 避免實作時修正
2. **vitest + Next.js dynamic route 處理**: SOP 可加註解, dynamic route `[id]` 的守護測試放 `tests/` 而非 `app/` 下
3. **守護測試數量預估可更精準**: Sprint 50 Plan Gate 預估 +10 ~ 12, 實際 +23。建議守護測試預估上修 1.5 ~ 2 倍

---

## §7 Sprint 50 結論

### 成功

- ✅ 1 commit / 0.8 SP / 4 FR 全部按 Plan Gate 完成
- ✅ SourcesList v2 升級完成 (icon + 標籤 + 下載按鈕 + 下載 API)
- ✅ RBAC 三層守衛完整 (401/403/404)
- ✅ path traversal 防護 + 中文檔名 RFC 5987 編碼
- ✅ 23 個守護測試, 比預期 +11
- ✅ 既有 SourcesList v1 測試 5 個仍綠 (向後相容)

### 失敗

- 無 (1 commit 一次過 4 Gate)

### 學習

- **Plan Gate 寫程式碼前先 ls 套件**: 避免 icon 名稱不符預期
- **vitest 對 Next.js dynamic route 處理**: 守護測試放 `tests/` 而非 `app/` 下
- **既有功能守護不可省**: SourcesList v1 測試保留, 確保向後相容

### 為下一個 sprint 鋪墊

- Sprint 51 可考慮: SourcesList v3 (A2 圖片 preview) 或 CRUD List 增強 (P2)
- 或繼續 SourcesList v3+ (A3 全做) 範圍較大

---

## §8 統計

| 項目 | 數值 |
|---|---|
| Sprint 50 commits | 1 |
| Sprint 50 SP | 0.8 |
| Sprint 50 守護測試 | +23 |
| Sprint 50 新增檔案 | 4 (icon helper + route + 2 tests) |
| Sprint 50 修改檔案 | 1 (sources-list.tsx) |
| Sprint 50 行數變動 | +395 / -85 |
| Sprint 47~50 累積 FR | 65 |
| Sprint 47~50 累積 SP | ~20.4 |

---

**Sprint 50 結束時間**: 2026-09-01
**Sprint 50 SP 完成率**: 100% (0.8 / 0.8)
**Sprint 50 commits**: 1
**下一個 sprint**: Sprint 51 (待 Plan Gate)