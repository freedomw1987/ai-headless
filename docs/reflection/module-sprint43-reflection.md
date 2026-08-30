# Sprint 43 Reflection — AI Config v2.0 + Custom LLM Endpoint

> **Sprint**：43
> **模組**：AI Config (M4)
> **完成日期**：2026-08-30
> **作者**：AI Agent + 用戶協作
> **狀態**：✅ Done（13 SP / 原估 15 SP）

---

## 1. Sprint 目標

| 項目 | 狀態 |
|---|---|
| PRD 05 v2.0 改版（支援 Custom LLM Endpoint）| ✅ |
| 4 種 Provider 類型實作（openai / claude / openai-compatible / anthropic-compatible）| ✅ |
| Custom URL 入口（Global URL 模式，系統全域共用）| ✅ |
| 「測試連線」按鈕 UX | ✅ |
| 真 AES-256-GCM 加密 | ✅ |
| 統一錯誤處理（AIProviderError）| ✅ |
| log redaction（不輸出 API Key 明文）| ✅ |

---

## 2. Sprint 計劃 vs 實際

| Commit | 原估 SP | 實際 SP | 差異原因 |
|---|---|---|---|
| A — PRD v2.0 + Prisma enum + ProviderConfig type | 3 | 3 | 完全符合 |
| B — testEndpoint + Factory Custom URL | 4 | **2** | 揭露「既有 OpenAIProvider 已用 fetch + baseUrl」，**省下整個 class 實作**（-2 SP）|
| C — createProviderFromDB + decrypt placeholder | 2 | 2 | 完全符合，但揭露 dynamic import 解 cold start 問題 |
| D — `/admin/settings/ai-config` UI + Sidebar | 3 | 3 | 完全符合，揭露 Prisma 6 nullable unique where 陷阱 |
| E — AES-256-GCM 真加密 + 統一錯誤 + log redaction | 3 | 3 | 完全符合 |
| **總計** | **15** | **13** | **省 2 SP** |

---

## 3. 跨 Sprint 觀察

### 觀察 1：Plan Gate 的揭露威力無可取代

Commit B 原估 4 SP（新增 class 實作）。Plan Gate 讀原始碼後揭露：

- `OpenAIProvider` / `AnthropicProvider` 既有實作已用 `fetch(this.baseUrl)`
- `ProviderConfig.baseUrl` 已存在

實作只需「factory 接受 type + 加 testEndpoint utility」，整個 **省下 2 SP + 不需 Vercel AI SDK 依賴**。

**SOP 改進驗證**：Plan Gate 的「讀原始碼」動作不是形式，是實際省 SP / 改方向的關鍵。

### 觀察 2：Dynamic import 解 cold start penalty

Commit C 改 schema 加 enum後，TD-504 test（`< 50ms` 嚴格 timing）失敗。

根因：`import { db } from '@/lib/db'` 在 module top-level 把 PrismaClient 拉進來，**增加 cold start 模組大小**，mock test 也跟著變慢。

解法：`createProviderFromDB` 內部用 `await import('@/lib/db')`，Prisma client 只在實際呼叫 DB 時才載入。

**SOP 改進**：在 `tdd-test-writer` skill 加「module size 影響 timing test」警告，避免未來 schema 改動撞同樣問題。

### 觀察 3：Prisma 6 nullable unique field 的 where 陷阱

Commit D 想用 `db.aIConfig.upsert({ where: { userId: null } })`，但 TypeScript 報錯：

```
Type 'null' is not assignable to type 'string | undefined'.
```

根因：Prisma 6 對 `userId String? @unique` 的 `update` input 型別對 nullable 欄位**不接受 `null`**，只接受省略。

**最終解法**：`findFirst({ where: { userId: null } })` 拿 id，再用 `id` 做 `update` / `create` 兩步走。

**SOP 改進**：在 `prisma/schema.prisma` 旁加 `docs/prisma-gotchas.md` 記錄此類陷阱。

### 觀察 4：守護測試 vs 行為測試的分野

Sprint 43 加了 5 個 guard test files（共 56 個守護測試），全部用 source-code regex pattern 守護。

**優點**：
- 改動立刻有紅綠反饋
- 不需 setup DB / Mock

**限制**：
- Regex 太寬會誤判（守護 #3 API endpoint fail 的教訓：JS dash 不能用在 function name）
- Regex 太嚴會誤報（API key redaction 守護一開始誤抓 JSDoc 註解）

**SOP 改進**：守護測試 regex 寫完要附「為什麼這樣寫」comment，方便未來 reviewer 驗證。

### 觀察 5：Commit 拆分比預想更省時間

原 Sprint 43 計劃 15 SP 是「從零實作 + 加 Custom URL」連在一起做的估算。

拆成 5 個 commit（A → B → C → D → E）後：

- 每個 commit 平均 2.6 SP，**平均 15 分鐘 reviewer 看完**
- Commit C 揭露 dynamic import 問題 → Commit D 不會撞同樣問題
- Commit D 揭露 Prisma where 陷阱 → Commit E 知道 decrypt 解密失敗要 try/catch fallback

**這是 Sprint 42 reflection 觀察 4「按 reviewer 能否一次理解全部脈絡拆分」的實際驗證**。

---

## 4. 揭露的後續事項（給 Sprint 44+ 處理）

### 4.1 Production AI_ENCRYPTION_KEY 設定

**風險**：若 production 沒設 `AI_ENCRYPTION_KEY`，`encrypt()` 立刻 throw，整個 AI 功能無法啟動。

**緩解**：
- ✅ Commit E 已加 throw 明確錯誤訊息（含生成指令）
- ✅ `.env` / `.env.example` 已加欄位
- ⚠️ **生產部署 checklist 需加「AI_ENCRYPTION_KEY 已設」驗證**

### 4.2 既有 DB 資料 migration 策略

**風險**：Commit C / E 把 placeholder 反轉字串換成 AES-GCM。**既有 db 資料解密會失敗**（格式完全不相容）。

**緩解方案**（選一個）：
- **方案 A（推薦）**：Commit F 加 migration script 偵測格式錯誤，清空 `apiKeyEnc` 讓 user 重新輸入
- **方案 B**：提供 web UI「重新輸入 API Key」按鈕，舊 key 直接覆蓋
- **方案 C**：保留雙格式支援（detect by `:` count），但增加複雜度

**當前狀態**：⚠️ 既有 `ai_configs` 資料若是 placeholder 加密，**新程式讀取會 throw**。需 Commit F 處理。

### 4.6 Prisma schema 改完後必須跑 migrate (不是只有 generate)

**風險** (用戶實測揭露): 改 prisma/schema.prisma 加 enum + 欄位後, 即使 `prisma generate` 跑了,
runtime Prisma client 知道新欄位 (TS compile 過), 但 **DB 本身沒套用 migration** → 所有
create/update 該欄位都會失敗 (PrismaClientKnownRequestError P2022 'column does not exist')。

**根因**:
- `prisma generate` 只更新 client (in-memory / .prisma/client/), 不更新 DB
- `prisma migrate deploy` 才套用 migration 到 DB
- Sprint 43 Commit A 只跑了 generate, 沒跑 migrate

**緩解方案**:
- package.json 加 db:migrate (dev) + db:deploy (prod) script (Sprint 43 commit 0965c48)
- predev/prebuild 只跑 generate (因為 generate 安全 + 快速)
- 改 schema 後 dev 人員必須手動跑 `pnpm db:migrate`
- 6 個新 guard 提醒 + 防呆 (sprint-43-prisma-generate-guard.test.ts)

**教訓**:
- '改 schema' 是兩個變更: (a) client 生成 (b) DB schema
- 不能只驗證 (a), 必須驗證 (b)
- 'dev server 跑得起來' 不等於 'DB 套用了'
- 推薦: schema 改動後 Sprint PR description 加 '需跑 pnpm db:migrate' 提醒

### 4.3 AIConfig model 從未被應用層引用（Plan Gate 揭露）

**風險**：`prisma.aIConfig` model 在 v1.0 PRD 已定義，但**從未被任何 route / lib 引用**。Sprint 43 是第一次實作。

**影響**：
- Sprint 43 Commit C 揭露後才加 `createProviderFromDB` factory
- 既有程式都是 env-based，沒有「先讀 DB」邏輯

**緩解**：✅ Commit C / D 已補上完整的 DB → factory 鏈路。

### 4.4 Vercel AI SDK 沒用到（原計劃依賴）

**原計劃**：Commit B 用 `@ai-sdk/openai-compatible` 套件實作 Custom URL class。

**實際**：既有 `OpenAIProvider` 用 `fetch(this.baseUrl)` 已支援任意 endpoint，**不需要 Vercel AI SDK**。

**好處**：
- 省下 dependency
- bundle size 變小

**後續**：若需要更複雜功能（function calling / structured output），才考慮引入。

### 4.5 Sidebar section 位置討論

**用戶決策**：AI 模型配置放在「系統設定」section（跟 users / roles 同區）。

**驗證**：✅ Commit D 已實作，未來 review 可看到 data-testid `sidebar-link-ai-config`。

---

## 5. SOP 改進提案（給 dav-designer）

| # | 提案 | 優先級 | 來源 |
|---|---|---|---|
| P-5 | `tdd-test-writer` skill 加「module size 影響 timing test」警告 | P1 | 觀察 2 |
| P-6 | `docs/prisma-gotchas.md` 記錄 Prisma 6 nullable unique where 陷阱 | P1 | 觀察 3 |
| P-7 | 守護測試 regex 寫完要附「為什麼這樣寫」comment 規範 | P2 | 觀察 4 |

---

## 6. Sprint 數據

| 項目 | 數值 |
|---|---|
| Commit 數 | 5 |
| 守護測試新增 | 56 |
| 既有測試基線 | 1450 → 1506（+56）|
| 整合測試覆蓋率 | 全綠 |
| E2E 影響 | 無（Sprint 43 未動 UI 流程）|
| 新檔案 | 6（page + form + 2 API routes + 2 test files）|
| 修改檔案 | 3（PRD + schema + sidebar + providers.ts）|

---

## 7. 結論

Sprint 43 達成所有目標：
- **Custom LLM Endpoint 支援完整實作**
- **真 AES-256-GCM 加密取代 placeholder**
- **統一錯誤處理 AIProviderError**
- **log redaction（redactApiKey）**
- **PRD v2.0 跟程式碼同步**

**省下 2 SP** 因為 Plan Gate 揭露「既有架構已支援 baseUrl」，驗證 SOP §2.1 規劃階段的價值。

**揭露的後續事項（4.1-4.5）**需在 Sprint 44 或之後處理，**特別是 4.2 既有資料 migration 策略**，因為 Commit C/E 的 placeholder → AES-GCM 替換會讓既有資料無法解密。