# PRD: Framework Core (Module 1)

> **模組代號**：M1
> **模組名稱**：Framework Core
> **版本**：1.0.0
> **最後更新**：2026-08-24
> **狀態**：Ready for Sprint 1

---

## 1. 模組概述

### 1.1 模組目標

M1（Framework Core）是整個 ai-headless 框架的核心模組。它提供：

1. **JSON 規範處理**：解析、驗證、編譯 JSON 規範
2. **AI Pipeline**：自然語言需求 → JSON 規範 → 可運行代碼
3. **Extension 系統**：Extension 發現、註冊、加載、卸載
4. **共用組件庫**：CRUD UI 組件（DataTable、FormBuilder 等）

### 1.2 模組邊界

| 屬於 M1 | 不屬於 M1 |
|---|---|
| JSON Spec Compiler | 用戶認證（M2） |
| Extension Loader | Blog 範例（M3） |
| Extension Registry | AI 模型配置（M4） |
| AI Pipeline 架構 | AI Chat UI（M5） |
| 共用 CRUD 組件 | Extension 管理 UI（M6） |

### 1.3 依賴關係

- **依賴**：無（M1 是基礎，其他模組依賴它）
- **被依賴**：M2、M3、M4、M5、M6

---

## 2. 功能清單（Functional Requirements）

### 2.1 FR-1: JSON Spec 處理

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-1.1 | 解析 JSON 規範文件 | P0 | 1 |
| FR-1.2 | 用 JSON Schema 校驗輸入 | P0 | 2 |
| FR-1.3 | 把 JSON 規範轉 TypeScript Types | P0 | 2 |
| FR-1.4 | 支援 CRUD Extension 的 JSON 規範 | P0 | 1 |

### 2.2 FR-2: Code Compiler

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-2.1 | Schema Generator：JSON → Prisma schema + Migration | P0 | 5 |
| FR-2.2 | API Generator：JSON → REST API routes | P0 | 5 |
| FR-2.3 | UI Generator：JSON → 前端組件（列表、表單、詳情） | P0 | 8 |
| FR-2.4 | Menu Generator：JSON → 後台選單註冊 | P0 | 1 |
| FR-2.5 | Permission Generator：JSON → 權限定義 | P0 | 2 |

### 2.3 FR-3: AI Pipeline（由 pi agent 驅動）

> **重要決策**：AI Pipeline **不用純 LLM API**，而是用 **pi agent** 作為執行者。
> 理由見 `docs/system-design.md §6.1`。

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-3.1 | pi agent 觸發器：接收用戶輸入，啟動 subagent | P0 | 3 |
| FR-3.2 | pi agent Context 注入：自動讀 AGENTS.md、json-spec.md、extension-spec.md 等規範 | P0 | 2 |
| FR-3.3 | Stage 1-2 需求分析 + 反問釐清 | P0 | 5 |
| FR-3.4 | Stage 3 JSON Spec 生成（讀 json-spec.md） | P0 | 3 |
| FR-3.5 | Stage 4 TDD Gate（先寫測試，紅→綠） | P0 | 3 |
| FR-3.6 | Stage 5 Code Compiler（Schema/API/UI **+ Extension Code** Generator） | P0 | 5 |
| FR-3.7 | Stage 6 Lint Gate | P0 | 1 |
| FR-3.8 | Stage 7 Regression Gate | P0 | 1 |
| FR-3.9 | Stage 8 Reviewer Gate + Submitter | P0 | 3 |
| FR-3.10 | 串流回應（用戶看到 AI 思考過程） | P1 | 3 |
| **FR-3.11** | **混合模式：自動產生 Extension Code（hooks / actions / computed / workflows）** | **P0** | **5** |
| **FR-3.12** | **混合模式：{{fn:...}} 引用解析、確保 JSON 與 Extension Code 名稱對應** | **P0** | **2** |

> 💡 **混合模式**：FR-3.11 和 FR-3.12 是 v1.0.0 重大升級。見 `docs/system-design.md §13` 和 `docs/specs/json-spec.md §3.6-3.9`。

**完整流程圖見 `docs/system-design.md §6.2`**。

**pi agent 調用範例**：

```typescript
// app/api/ai/generate/route.ts
import { runSubagent } from '@/lib/ai/agent-runner';

export async function POST(request: Request) {
  const { userInput } = await request.json();
  
  const result = await runSubagent({
    agent: 'json-spec-compiler',
    contextFiles: [
      'AGENTS.md',
      'docs/specs/json-spec.md',
      'docs/specs/extension-spec.md',
      'docs/system-design.md',
      'docs/DESIGN.md',
      'docs/backlog.md',
    ],
    task: `用戶需求：${userInput}\\n請按 docs/specs/json-spec.md 規範生成完整系統`,
  });
  
  return Response.json(result);
}
```

### 2.4 FR-4: Extension 系統

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-4.1 | Extension Discovery：掃描 `extensions/` 目錄 | P0 | 2 |
| FR-4.2 | Extension Validation：驗證 manifest.json | P0 | 2 |
| FR-4.3 | Extension Registry：註冊/反註冊 | P0 | 3 |
| FR-4.4 | Extension Loader：動態加載 Extension 代碼 | P0 | 3 |
| FR-4.5 | Extension Lifecycle：onLoad / onUnload / onConfigChange | P0 | 2 |
| FR-4.6 | Extension API（db, auth, rbac, ai, storage, events） | P0 | 8 |

### 2.5 FR-5: 共用 CRUD 組件

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-5.1 | DataTable 組件（基於 TanStack Table） | P0 | 3 |
| FR-5.2 | FormBuilder 組件（基於 React Hook Form） | P0 | 5 |
| FR-5.3 | DetailView 組件 | P0 | 2 |
| FR-5.4 | FilterBar 組件 | P1 | 2 |
| FR-5.5 | Pagination 組件 | P0 | 1 |
| FR-5.6 | 通用 Modal / Dialog | P0 | 2 |

### 2.6 FR-6: 混合模式 SDK（業務邏輯支援）

> **本節為 v1.0.0 重大升級**。見 `docs/system-design.md §13` 完整說明。

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-6.1 | **Hook SDK**：Extension 提供生命週期 hook（beforeCreate / afterCreate / onTransition 等 11 種） | P0 | 5 |
| FR-6.2 | **Action SDK**：Extension 提供自定義動作（按鈕）、帶 Zod input/output schema | P0 | 5 |
| FR-6.3 | **Computed Field SDK**：Extension 提供動態計算欄位、含 dependency 追蹤 | P0 | 3 |
| FR-6.4 | **Workflow SDK**：Extension 提供狀態機定義、框架提供轉換、guard、effect API | P0 | 8 |
| FR-6.5 | **{{fn:...}} 引用解析**：Compiler 讀取 JSON 中的引用、查 Extension Code 中是否有對應函數 | P0 | 3 |
| FR-6.6 | **Hook 自動調用**：框架自動在 CRUD 動作中 call 對應 hook | P0 | 3 |
| FR-6.7 | **Action 按鈕自動生成 UI**：Action 自動以按鈕形式出現在列表頁/詳情頁 | P0 | 3 |
| FR-6.8 | **Computed Field 自動渲染**：詳情頁自動顯示 computed field、可快取 | P1 | 2 |
| FR-6.9 | **Workflow 狀態切換 UI**：詳細頁顯示狀態機下拉、警告非法轉換 | P0 | 3 |

**總計**：35 SP（混合模式 SDK）

**詳細 SDK 定義見 `docs/specs/extension-spec.md §4.3-§4.6`**。

---

## 3. 非功能需求（Non-Functional Requirements）

### 3.1 性能

- JSON 編譯時間：< 5 秒（單個 CRUD 功能）
- Extension 加載時間：< 500ms（單個 Extension）
- DataTable 渲染：< 100ms（100 行資料）

### 3.2 安全

- AI 生成的代碼必須經過 Schema 校驗
- Extension 加載必須驗證 signature（v1.0 後）
- API Key 不 log、不暴露

### 3.3 可擴展性

- 支援任意 CRUD 類型（不限領域）
- 支援自定義 Widget（自定義表單組件）
- 支援自定義 Validator（自定義校驗規則）

### 3.4 可測試性

- 所有 Compiler 函數必須可單元測試
- Extension API 必須提供 mock 介面
- Code Compiler 必須可在 dry-run 模式運行（不寫檔案）

---

## 4. 介面設計

### 4.1 JSON Compiler API

```typescript
// lib/compiler/index.ts
import { compileJsonSpec, validateJsonSpec } from '@/lib/compiler';

const spec: JsonSpec = { /* ... */ };

// 1. 校驗
const validation = await validateJsonSpec(spec);
if (!validation.valid) {
  console.error(validation.errors);
  return;
}

// 2. 編譯（dry-run 模式，不寫檔案）
const result = await compileJsonSpec(spec, { dryRun: true });
console.log(result.files);  // 預覽要生成的檔案

// 3. 編譯（實際寫入）
const compiled = await compileJsonSpec(spec);
console.log(compiled.migrationId);  // 產生的 migration ID
```

### 4.2 Extension API

```typescript
// lib/extensions/registry.ts
import { registerExtension, loadExtension } from '@/lib/extensions';

// 註冊 Extension
await registerExtension({
  manifest: blogManifest,
  onLoad: (api) => { /* ... */ },
});

// 加載 Extension（從目錄）
await loadExtension('./extensions/blog');
```

### 4.3 AI Pipeline API

```typescript
// lib/ai/pipeline.ts
import { runPipeline } from '@/lib/ai/pipeline';

const result = await runPipeline({
  userInput: '幫我做個待辦事項',
  currentUser: session.user,
  onProgress: (step) => console.log(step),
});

// result = {
//   jsonSpec: {...},
//   compiledFiles: [...],
//   migrationId: '...',
//   extensionId: 'todo'
// }
```

---

## 5. 資料模型

### 5.1 Prisma Models（M1 負責的部分）

```prisma
// AI 生成的 Function（動態 CRUD）
model GeneratedFunction {
  id          String   @id @default(cuid())
  name        String   @unique
  jsonSpec    Json     // 完整 JSON 規範
  compiledAt  DateTime @default(now())
  status      String   // "active" | "disabled"
  source      String   // "user-input" | "extension"
  
  @@map("generated_functions")
}

// AI 編譯歷史
model CompilationLog {
  id          String   @id @default(cuid())
  functionId  String
  function    GeneratedFunction @relation(fields: [functionId], references: [id], onDelete: Cascade)
  inputJson   Json     // 輸入的 JSON 規範
  outputFiles Json     // 編譯產生的檔案清單
  status      String   // "success" | "failed"
  error       String?
  duration    Int      // 毫秒
  createdAt   DateTime @default(now())
  
  @@map("compilation_logs")
}
```

---

## 6. 使用者故事（User Stories）

### 6.1 US-M1-01：AI 生成 CRUD 功能

> **作為** 終端用戶
> **我想要** 透過 AI 對話生成 CRUD 功能
> **以便** 我不用寫代碼也能擴展系統

**驗收標準**：
- [ ] 用戶輸入「幫我做待辦事項」，系統生成 CRUD 功能
- [ ] 自動生成 Prisma migration、API routes、前端 UI
- [ ] 後台選單出現「待辦事項」選項
- [ ] 用戶可立即使用該功能
- [ ] 提供「下載 JSON」按鈕

### 6.2 US-M1-02：AI 生成 Extension

> **作為** 終端用戶
> **我想要** 透過 AI 對話生成 Extension
> **以便** 我可以添加新的功能模組

**驗收標準**：
- [ ] 用戶輸入「加一個留言板 Extension」，系統生成 Extension
- [ ] Extension 自動安裝並啟用
- [ ] 後台管理頁面顯示已安裝 Extension
- [ ] 用戶可啟用/停用/配置 Extension

### 6.3 US-M1-03：查看已生成功能

> **作為** 管理員
> **我想要** 查看所有 AI 生成的功能
> **以便** 我能管理它們

**驗收標準**：
- [ ] 後台頁面列出所有 AI 生成的功能
- [ ] 顯示生成時間、狀態（啟用/停用）
- [ ] 可查看 JSON 規範（下載或查看）
- [ ] 可停用 / 啟用功能
- [ ] 可查看編譯日誌

---

## 7. 測試計劃

### 7.1 單元測試

- [ ] `validateJsonSpec`：合法 / 非法 JSON、缺失欄位、型別錯誤
- [ ] `compileJsonSpec`：每種 FieldType、Relation、Permission 場景
- [ ] `ExtensionLoader`：成功 / 失敗 / 重複加載
- [ ] `runPipeline`：完整 pipeline、錯誤恢復

### 7.2 整合測試

- [ ] 從 JSON 到可運行的完整流程
- [ ] Extension 加載後可在 UI 看見
- [ ] AI Pipeline 與 Extension 系統整合

### 7.3 E2E 測試

- [ ] 用戶對話 → 生成功能 → 使用功能（全流程）
- [ ] 用戶對話 → 生成 Extension → 使用 Extension

---

## 8. 開發計劃（Sprint 拆分）

### Sprint 1（本 Sprint）

**目標**：MVP pipeline 跑通

| Task | FR | SP |
|---|---|---|
| 建立專案結構、依賴 | — | 1 |
| JSON Schema + TypeScript Types | FR-1.1, FR-1.2, FR-1.3 | 3 |
| Schema Generator | FR-2.1 | 3 |
| API Generator | FR-2.2 | 3 |
| UI Generator | FR-2.3 | 5 |
| Permission Generator | FR-2.5 | 1 |
| AI Pipeline 骨架 | FR-3.1, FR-3.3, FR-3.4 | 5 |
| Extension Loader | FR-4.1 ~ FR-4.5 | 5 |
| Extension API | FR-4.6 | 5 |
| 共用 CRUD 組件 | FR-5.1 ~ FR-5.6 | 5 |
| 整合測試 | — | 3 |

**總計**：39 SP（佔 1 個 Sprint）

### Sprint 2

| Task | FR | SP |
|---|---|---|
| AI 反問釐清 | FR-3.2 | 3 |
| AI 串流回應 | FR-3.5 | 3 |
| FilterBar 等進階組件 | FR-5.4 | 2 |
| Extension Marketplace 雛形 | — | 5 |
| **混合模式：Hook SDK** | **FR-6.1** | **5** |
| **混合模式：Action SDK** | **FR-6.2** | **5** |
| **混合模式：Computed SDK** | **FR-6.3** | **3** |
| **混合模式：Workflow SDK** | **FR-6.4** | **8** |
| **混合模式：{{fn:...}} 引用解析** | **FR-6.5** | **3** |
| **混合模式：Hook 自動調用** | **FR-6.6** | **3** |
| **混合模式：Action 按鈕 UI** | **FR-6.7** | **3** |
| **混合模式：Workflow 狀態切換 UI** | **FR-6.9** | **3** |

**混合模式總計**：35 SP

### Sprint 3（混合模式延伸）

| Task | FR | SP |
|---|---|---|
| Computed Field 快取 | FR-6.8 | 2 |
| Workflow 視覺化設計器（v2） | — | 8 |
| Workflow 多狀態機平行 | — | 5 |
| Extension Code Marketplace | — | 5 |

---

## 9. 風險與緩解

| 風險 | 影響 | 緩解策略 |
|---|---|---|
| AI 生成的代碼有 bug | 高 | 強制 Schema 校驗 + 編譯 dry-run 模式 |
| Extension 互相衝突 | 中 | 命名空間隔離 + 衝突檢測 |
| 編譯時間太長 | 中 | 增量編譯（只編譯變更部分） |
| 用戶輸入太模糊 | 中 | AI 反問釐清（FR-3.2） |

---

## 10. 相關文檔

- 📐 [系統架構](../system-design.md)
- 🎨 [UX/UI 設計](../DESIGN.md)
- 📝 [JSON 功能規範](../specs/json-spec.md)
- 🔌 [Extension 開發規範](../specs/extension-spec.md)
- 📊 [Backlog](../backlog.md)

---

**模組負責人**：TBD
**開發負責人**：TBD
**測試負責人**：TBD