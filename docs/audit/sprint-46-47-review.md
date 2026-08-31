# Sprint 46 收尾 + Sprint 47 Plan Gate Review（2026-08-31）

> **範圍**：Sprint 46 commits 1-7 + 4 bug fixes（已 commit）+ Sprint 47 Plan Gate + PRD（未 commit）
> **重點**：correctness risks、UX regressions、missing tests、follow-up tasks
> **嚴重程度排序**：🔴 必修 / 🟡 應修 / 🟢 nice-to-have

---

## 🔴 必修（P0 / 必修 before Sprint 47 Commit 1）

### 1. Sprint 46 真實前端上傳根本沒接好（UX 失效）

**檔案**：`app/admin/_components/use-chat-stream.ts:74-79`

```ts
// 把附件檔名拼進 message content (S45-C 純前端, 不上傳)
const attachmentPrefix = attachments
  .map((a) => `📎 ${a.filename}${a.size ? ` (${formatSize(a.size)})` : ''}`)
  .join('\n');
const fullContent = attachmentPrefix ? `${attachmentPrefix}\n\n${text}` : text;
```

`send()` 拿到 `attachments` 後只是把 `📎 filename` 字串拼進 message，根本沒呼叫 `/api/admin/chat/upload`，也沒把 attachment IDs 帶去 `/api/admin/chat/stream`（line 103-110）。

**結果**：
- 後端 Stage 46-A 上傳 route、Stage 46-D attachment reader 都白做了 — 使用者上傳檔案後，AI 完全沒讀到內容
- 用戶看到的「📎 filename (12 KB)」其實就是字串假象
- E2E `sprint-46-attachments-markdown.spec.ts` mock stream API，沒有覆蓋到「選檔 → upload route → 真的傳到 LLM」這條鏈
- 整個 Sprint 46 的核心交付價值（**附件讓 AI 看**）沒有真正生效

**修正**：Sprint 47 Stage 47-3 已在 PRD §7.2 Step 1 規劃重構 `useChatStream.send()`；但此 bug 不該混在 Stage 47-3 裡 — 應該在 Sprint 46 reflection 或 Sprint 47 Commit 1 開工前先確認這條斷鏈。**建議在 Sprint 47 Commit 1 開工前先補一個 E2E「真實上傳 → 拿到 attachment ID → AI 回應含檔案內容」，驗證 Sprint 46 的端到端能跑通**。

---

### 2. Upload route 錯誤訊息顯示「max N」數字錯（CORRECTNESS）

**檔案**：`app/api/admin/chat/upload/route.ts:85`

```ts
return NextResponse.json(
  { error: `Too many files (max ${files.length})` },  // ← BUG
  { status: 400 },
);
```

上傳 15 個檔案時，錯誤訊息會說「max 15」而非「max 10」。應為：

```ts
{ error: `Too many files (max ${MAX_FILES_COUNT})` }
```

**影響**：低（不影響安全性，只是 UX 文案錯），但屬低階錯誤。**建議隨任何後續 upload 改動一併修**。

---

### 3. Stream route 缺 session ownership 檢查（SECURITY）

**檔案**：`app/api/admin/chat/stream/route.ts:41-105`

對比 upload route（`route.ts:64-79` 有做 session ownership 檢查），stream route 沒有。具體後果：

| 操作 | 是否過濾 | 風險 |
|---|---|---|
| `db.attachment.findMany` (line 47-58) | ✅ 過濾 `sessionId` | 低（附件查詢需同時知道 sessionId + attachmentId） |
| `db.chatMessage.create` user 訊息 (line 68-74) | ❌ 無過濾 | 🔴 **User A 可寫 user 訊息到 user B 的 session** |
| `db.chatMessage.create` assistant 訊息 (line 92-100) | ❌ 無過濾 | 🔴 **User A 可觸發 assistant 訊息寫到 user B 的 session（並消耗 B 的 token 配額）** |
| `db.chatSession.update` (line 101-104) | ❌ 無過濾 | 🟡 User A 可更新 user B 的 session updatedAt（low impact） |

Sprint 46 reflection 已列為 P2，但實際上 user A 只需要知道/猜到 user B 的 `sessionId`（cuid 雖不易猜，但 URL/log 可能洩漏）就能：
- **跨用戶注入訊息**（高）
- **消耗其他用戶的 LLM token**（中）
- **污染其他用戶的對話歷史**（中）

**建議**：
1. **提早處理**：不要等 Stage 47-6（1 SP）；可在 Sprint 47 Commit 1 一併做（0.3 SP）
2. **Plan Gate 應把這條從 P2 升為 P0**（寫進 PRD §9 風險表 + Plan Gate 風險表）
3. **先在現有 route 加 `requireSessionOwnership()`**，再用 guard 補全其他 route

---

### 4. Sprint 47 Plan Gate 文件有重複列（DOC BUG）

**檔案**：`docs/sprint47-plan-gate.md`

- **Line 86-87**：Stage 表 `47-7` 出現兩次（複製貼上錯誤）
  ```markdown
  | 47-7 | P2 | **TD-S47-MarkdownXSS**（XSS E2E 守護） | 0.5 | 防 Sprint 47+ 加 rehype-raw 引入 XSS |
  | 47-7 | P2 | **TD-S47-MarkdownXSS**（XSS E2E 守護） | 0.5 | 防 Sprint 47+ 加 rehype-raw 引入 XSS |  ← 重複
  ```
- **Line 137 + 141**：標題「風險預視（PRD §13 對齊）」重複

**建議**：commit Plan Gate 前用 grep 全文 dedup。

---

## 🟡 應修（P1 / Sprint 47 期間補）

### 5. PRD 風險編號與 Plan Gate 風險編號不一致

**Plan Gate 風險表**（sprint47-plan-gate.md:144-150）：
| ID | 風險 |
|---|---|
| R1 | pi-agent-sdk 不支援 sources/reasoning metadata |
| R2 | pi-agent-sdk 不支援 multi-modal image |
| R3 | Office Parser bundle 過大 |
| R5 | Session ownership 檢查漏 route |

**PRD §9.1 風險表**（prd/11-chat-v2-completions.md:942-949）：
| ID | 風險 |
|---|---|
| R1 | Office Parser bundle 過大 |
| R2 | pi-agent-sdk PromptOptions.images API 在某些 provider 不支援 |
| R3 | XHR abort 與 SSE abort 衝突 |
| R5 | Session Ownership 檢查漏 route |

**同個 Sprint 的兩個文件用不同編號指不同風險**，違反 SOP §2.5（單一事實來源）。**建議以 PRD §9.1 為準、Plan Gate 對齊**，或在 PRD §13 Plan Gate 紀錄引用 Plan Gate 的編號。

---

### 6. Attachment reader `kind: 'unsupported'` 永遠 placeholder（UX）

**檔案**：`lib/ai/chat/attachment-reader.ts:104-106`

```ts
return {
  kind: 'unsupported',
  filename,
  mime,
  reason: 'Sprint 47+ will add parser (PDF/DOCX/XLSX/PPTX)',
};
```

使用者上傳 PDF/DOCX 後：
- AI 在 prompt 看到的是 `\n\n--- Attached file: xxx.pdf (not parsed, Sprint 47+) ---`
- 沒任何 toast / 警告告訴使用者「這個檔案類型還沒支援」
- 整個 Sprint 46 在使用者眼中就是「上傳什麼 AI 都讀得到」但其實 Office 類都默默失敗

**建議**：
- Frontend 上傳成功後立刻檢查 `kind === 'unsupported'`，顯示警告 chip
- 或在 upload route 把不支援的副檔名直接擋掉（401 with clear message）
- PRD §1.3 已排除 Office parser，但前端 UX 沒對應處理 — **應在 Stage 47-3 補上**

---

### 7. Cleanup utility 沒驗證 cwd 路徑

**檔案**：`lib/ai/chat/attachment-cleanup.ts:66`

```ts
await unlink(att.storagePath).catch(() => { /* idempotent */ });
```

`storagePath` 是相對路徑（如 `uploads/<sessionId>/<uuid>.txt`）。當 Vercel Cron 跑時 `process.cwd()` 是 repo root — 相對路徑 OK。但若部署到不同 cwd（如 monorepo subdir、容器），可能 unlink 失敗而 silently 計入 `failed`。

**測試覆蓋**：`attachment-cleanup.test.ts` mock Prisma 但**沒 assert unlink 被呼叫的實際路徑**。Sprint 47 Stage 47-5 整合測試應加：
- 確認 `unlink` 收到的路徑 == DB `storagePath`
- 確認 cron route 在 production cwd 跑通

---

### 8. PRD §4.7 session ownership 流程沒涵蓋 stream route 完整鏈

**檔案**：`docs/prd/11-chat-v2-completions.md:407-426`

PRD 寫的流程在「拿到 sessionId 後 call `requireSessionOwnership(sessionId, user.id)`」就結束，但 stream route 還有兩個 DB 寫入點：
- `db.chatMessage.create` (line 68, 92)
- `db.chatSession.update` (line 101)

helper 函式只擋「能不能進 stream」，擋不了「能不能寫入」。建議：
- `requireSessionOwnership()` 改名 `requireSessionWriteOwnership()` 並回傳 `session` 物件
- 或 helper 只 verify，stream route 內所有 `db.chatMessage.create` / `db.chatSession.update` 都要帶 `sessionId` 並 `where: { id: sessionId, userId: user.id }`（雙條件）

---

## 🟢 Nice-to-have

### 9. PRD §6.2 缺上傳錯誤的 E2E 場景

Stage 47-3 的 E2E 只有「選檔 → upload → AI 回應」與「10MB+ toast 錯誤」2 個場景。缺：
- **MIME 不符 → toast「不支援的格式」**
- **RBAC 失敗 → 導向登入**（未登入 / 非 admin）
- **網路斷線 → retry button**

Sprint 46 的 upload route 有 28 個守護測試，但**沒有任何 E2E**。建議至少補 1 個 happy-path E2E 守護「端到端 upload 真實生效」，而不是 mock stream。

---

### 10. Stage 47-5 cleanup cron 沒討論 Vercel Cron 預設 header

PRD §5.2.1 寫「`Authorization: Bearer <CRON_SECRET>`」守衛，但 Vercel Cron 預設**不**帶 Authorization header。需要：
- 在 `vercel.json` 加 `headers` 設定（Vercel 支援 cron path 的自訂 header）
- 或用 `?secret=` query param（Vercel 支援 cron query param）

PRD FR-6.5「Vercel Cron 環境變數設定」沒寫清楚。建議在 commit 6 開工前先 spike。

---

### 11. Attachment path 在不同環境的一致性

| 位置 | 路徑格式 |
|---|---|
| `upload/route.ts:144` | `uploads/${sessionId}/${storedName}` |
| `attachment-cleanup.ts:66` | 用 `att.storagePath` unlink |

`storagePath` 是「相對於 `process.cwd()`」，但 doc comment（line 35）寫「`./uploads/<sessionId>/<uuid>.<ext>`」。**實際存的是 `uploads/...`（不帶 `./`）**。若 production 跑在 monorepo subdir，會找不到檔案。

**建議**：統一用 `path.resolve(process.cwd(), att.storagePath)` 確保絕對路徑；或在 upload 階段存絕對路徑。

---

### 12. Test coverage 數字口徑不一

`docs/backlog.md` 寫 Sprint 46 收尾 baseline：
- Line 47: 「1587 integration + 127/127 E2E」（Sprint 44）
- Line 48: 「1506 integration + 120/120 E2E」（Sprint 43 — 比 Sprint 44 還少，**順序或數字錯**）
- Sprint 46 commit message: 「1795 unit/integration + 6 E2E passed」
- PRD §12.4: Sprint 44 = 1629 / 127, Sprint 46 = +166 / +6, Sprint 47 預估 = 1841 / 141

四個數字對不上。**建議以 PRD §12.4 為 single source of truth，回頭修 backlog.md**。

---

## Follow-up Tasks（建議建立）

| # | Task | Stage | 優先 | 估時 |
|---|---|---|---|---|
| F1 | `useChatStream.send()` 真實接 upload route（Sprint 46 漏做） | 47-3 | P0 | 1 SP |
| F2 | stream route 補 `requireSessionOwnership()` | 47-6（提早到 47-1） | P0 | 0.3 SP |
| F3 | 上傳錯誤 E2E（MIME/RBAC/網路） | 47-3 | P1 | 0.5 SP |
| F4 | Office 附件前端警告 chip | 47-3 | P1 | 0.3 SP |
| F5 | `cleanupOldAttachments` path resolve 統一 | 47-5 | P1 | 0.2 SP |
| F6 | Vercel Cron header / query 設定 spike | 47-5 | P1 | 0.2 SP |
| F7 | Plan Gate 風險編號對齊 PRD §9 | doc | P2 | 0.1 SP |
| F8 | `sprint47-plan-gate.md` dedup 重複列 | doc | P2 | 0.05 SP |
| F9 | `docs/backlog.md` 測試基線數字統一 | doc | P2 | 0.1 SP |
| F10 | upload route 錯誤訊息「max N」修正 | 47-1 順手 | P3 | 0.05 SP |

---

## 結論

- **Sprint 46 真正生效的功能**：附件 schema、上傳 route、MIME 驗證、cleanup utility、markdown 渲染、agent-sdk 重構、4 個 bug fix。
- **Sprint 46 沒真正生效的功能**：**前端真實上傳到 AI 看到內容**（F1，Stage 47-3 補）。
- **Sprint 46 沒抓到的風險**：stream route 缺 session ownership（已升為 P0，F2）。
- **Sprint 47 Plan Gate / PRD 文件**：整體品質好（14 章節完整、風險齊全、降階方案清楚），但有小 dedup 與編號對齊問題（F7-F8）。
- **建議進入 Sprint 47 Commit 1 前的 0-day 動作**：修 F2（stream route session ownership），把 PRD §9 風險 R5 升 P0。

Sprint 47 開工前若能把 F1-F4 一起處理，整體 Sprint 47 工作量會從 17 SP 降到 ~14 SP（提早抓漏 + 減少 Stage 47-3 變更風險）。
