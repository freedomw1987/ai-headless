# 🚀 Sprint 46 Plan Gate（2026-08-31）

> **Sprint 主題**：真實附件上傳 + 進階 Markdown + 自製 Sources/Reasoning UI（三主題並進）
> **預估規模**：22 SP（7 個 Stage）
> **Plan Gate 狀態**：🟡 進行中（產品/技術決策已收齊，待寫 PRD 進 Design Gate）
> **起點**：Sprint 45 reflection §7「真實附件上傳」「進階 Markdown」「Sources/Reasoning 元件評估」三項揭露

---

## 三主題對話記錄（2026-08-31）

> 用戶：進入 Sprint 46
> BA(我)：依 SOP 進 Plan Gate，先確認 Sprint 範圍（三主題 vs 三選一 vs 三個一起做）
> 用戶：三個一起做（Sprint 46 全包）
> BA(我)：依「一次一個問題」原則，先從最阻塞的「真實附件上傳」開始問問題
>
> **主題 1：真實附件上傳**（10 個問題）
> Q1 用戶：上傳文件讓 AI 讀取內容
> Q2 用戶：純文字類 + Office 文件 + HTML/XML/SVG（未選代碼源檔）
> Q3 用戶：Sprint 46 同時實作圖片 vision（針對前題「可能是 img」追問）
> Q4 用戶：10 MB 上限（MVP）
> Q5 用戶：本機檔案系統（推薦 MVP）
> Q6 用戶：永久保留（推薦 MVP）
> Q7 用戶：最多 10 個附件
> Q8 用戶：全文進 context（推薦 MVP，不做 RAG）
> Q9 用戶：圖片走 Custom URL Provider（保留 Sprint 43 投資）
> Q10 用戶：MIME 白名單 + 大小上限 + RBAC 守衛（未選病毒掃描，留 Sprint 47+）
>
> **主題 2：進階 Markdown**（4 個問題）
> Q11 用戶：code block（已有）+ inline + 標題段落 + 列表引言連結（四類全要）
> Q12 用戶：裝 react-markdown + remark-gfm（推薦）
> Q13 用戶：完全取代 Sprint 45 自製 parser（推薦）
> Q14 用戶：用 components.code slot 接 Sprint 45 自製 CodeBlock（保留 shiki 高亮）
>
> **主題 3：Sources/Reasoning 評估**（3 個問題）
> Q15 用戶：保留 Custom URL + 自製 Sources/Reasoning UI（推薦）
> Q16 用戶：Sources（來源引用）+ Reasoning（推理過程）；未選 Token 使用量（留 Sprint 47+）
> Q17 用戶：Message 內容下方、預設收合、點擊展開（推薦）
>
> Q18 用戶：接受 22 SP 估算（Sprint 46 全包、不拆 46A/46B）

---

## Stage 拆分 + SP 估算（22 SP 總計）

| Stage | 主題 | 預估 SP | 關鍵交付 | 改動模組 |
|---|---|---|---|---|
| **46-A** | Backend: 附件上傳 route + 安全 | 5 | `/api/admin/chat/upload` + RBAC（`admin` role）+ MIME 白名單（純文字 + Office + HTML/XML/SVG + 圖片）+ 大小上限 10 MB + 本機存 `./uploads/` | M5 backend |
| **46-B** | Backend: 附件解析 + prompt context | 4 | PDF (pdf-parse) + DOCX/PPTX (mammoth) + XLSX (xlsx) + 純文字直接讀 + 圖片 multipart 不解析直送 Custom URL vision | M5 backend |
| **46-C** | Frontend: 附件上傳流程接 server | 2 | useChatStream 改 multipart fetch + 上傳進度條 + 錯誤處理（10 MB 超限、格式不符）+ XHR abort 整合 | M5 frontend |
| **46-D** | Frontend: 取代自製 parser → react-markdown | 3 | 裝 react-markdown + remark-gfm + MarkdownRender 重寫 + components.code slot 接 Sprint 45 CodeBlock（shiki）+ 刪自製 parseMarkdown + 10 個舊單元測試重寫為 react-markdown 整合測試 | M5 frontend |
| **46-E** | Frontend: 自製 Sources / Reasoning UI | 3 | `<SourcesList>` + `<ReasoningSection>` 兩元件 + useChatStream metadata 串接 + Message 下方預設收合 + 點擊展開 + 鍵盤可達 | M5 frontend |
| **46-F** | DB schema: Attachment table + session FK | 2 | Prisma migration: `Attachment` model + `sessionId` FK + metadata (mime/size/path/originalName/uploadedAt) + 永久保留機制（無 cascade delete） | M5 + Prisma |
| **46-G** | E2E + Submit Gate | 3 | 多場景 E2E（純文字上傳、PDF 上傳、Office 上傳、10 MB 超限拒收、RBAC 阻擋、Markdown 完整渲染、Sources 收合展開）+ Submit Gate 交付 | M5 testing |

---

## 產品決策表（已確認）

| 維度 | 決策 | 理由 |
|---|---|---|
| **附件主要用途** | 上傳文件讓 AI 讀取 + 圖片 vision | Q1 + Q3 確認 |
| **支援文件類型** | .txt .md .json .csv .log + .pdf .docx .xlsx .pptx + .html .xml .svg | Q2 確認（未選代碼源檔）|
| **支援圖片類型** | PNG / JPG / WebP / GIF（vision）| Q3 + Q9 確認 |
| **單檔上限** | 10 MB | Q4 確認 |
| **Storage** | 本機 `./uploads/` | Q5 確認（MVP） |
| **生命週期** | 永久保留、綁定 session | Q6 確認（MVP） |
| **多附件上限** | 最多 10 個 | Q7 確認 |
| **AI 讀取方式** | 全文進 context（無 RAG）| Q8 確認（MVP）|
| **Vision 整合** | 走 Custom URL Provider | Q9 確認（保留 Sprint 43 投資）|
| **安全策略** | MIME 白名單 + 大小上限 + RBAC | Q10 確認（不裝 ClamAV，留 Sprint 47+）|
| **Markdown 元素** | code + inline + 標題段落 + 列表引言連結 | Q11 確認 |
| **Markdown 套件** | react-markdown + remark-gfm | Q12 確認 |
| **自製 parser 取捨** | 完全取代 | Q13 確認（codebase 整潔優先）|
| **code block 處理** | react-markdown components.code slot 接 Sprint 45 CodeBlock | Q14 確認（保留 shiki 高亮）|
| **Sources/Reasoning 架構** | 保留 Custom URL + 自製 UI | Q15 確認（Sprint 43 投資保留）|
| **Metadata 類型** | Sources + Reasoning（不含 Token 使用量）| Q16 確認 |
| **Sources/Reasoning UX** | Message 下方預設收合 | Q17 確認 |

---

## 技術風險與緩解

| 風險 | 影響 | 緩解 |
|---|---|---|
| 解析大型 PDF（>100 頁）撐爆 AI context | Token 用量爆增 / 回應失敗 | Stage 46-B 加 token 預估、超過 50K tokens 警告 user |
| mammoth/pdf-parse/xlsx bundle size | 部署 size 增加 | Stage 46-B 評估動態 import，僅上傳時載入 |
| react-markdown 取代自製 parser 後 XSS 風險 | AI 回應含惡意 HTML | Stage 46-D 用 react-markdown 預設 XSS 防護 + 守護測試 |
| Sprint 45 10 個 markdown-parser 純函數測試失效 | 測試基線下降 | Stage 46-D 重寫為 react-markdown 整合測試 |
| Attachment 無 cleanup 機制 | DB 與磁碟無限成長 | Stage 46-F 加 session soft-delete 欄位 + Sprint 47+ 加 cleanup job |
| 圖片 vision 沒 prompt context 設計 | AI 不知道用戶問圖的什麼 | Stage 46-C 上傳後 user message 自動加 `[Image attached: filename]` prefix |

---

## 不在 Sprint 46 範圍（明確排除）

- ❌ 病毒掃描（ClamAV / 第三方）— 留 Sprint 47+
- ❌ RAG / 向量資料庫 — 留 Sprint 47+（依檔案大小自動分流）
- ❌ Token 使用量 UI 顯示 — 留 Sprint 47+
- ❌ Attachment cleanup job — 留 Sprint 47+
- ❌ 訊息編輯 / 重新生成（從 Sprint 45 §7 #4）— 留 Sprint 47+
- ❌ 附件縮圖預覽（從 Sprint 45 §7 #5）— 留 Sprint 47+

---

## 開工時程（22 SP / 預估 6-7 天）

- 順序：(1) 46-F Attachment schema → (2) 46-A upload route → (3) 46-B parser → (4) 46-C frontend upload → (5) 46-D markdown → (6) 46-E Sources/Reasoning → (7) 46-G E2E + Submit Gate
- 4 Gate：Gate 1 TDD → Gate 2 lint/typecheck → Gate 3 regression → Gate 4 reviewer + E2E

---

## Plan Gate 完成證明

- ✅ 主題 1（真實附件上傳）：10 個產品/技術問題全部回答
- ✅ 主題 2（進階 Markdown）：4 個問題全部回答
- ✅ 主題 3（Sources/Reasoning 評估）：3 個問題全部回答
- ✅ SP 估算：用戶確認 22 SP（全包、不拆 46A/46B）
- ✅ 風險與排除項目都已明確列出
- ✅ 開工順序已規劃

**下一步**：Design Gate（撰寫 `docs/prd/10-chat-attachments.md` PRD，定義 wireframe + Task 細節 + Commit 規劃）
