# Sprint 55 Design Gate — AI 生成 extension 端到端流程

> **日期**: 2026-09-05
> **Sprint**: Sprint 55
> **狀態**: ✅ Design Gate 完成
> **對應 Plan Gate**: docs/sprint55-plan-gate.md

---

## §1 設計目標

**接通端到端流程**: admin chat 輸入 `/extension create <name> --fields=f1,f2` → 30 秒後 `extensions/<name>/` 出現 8 個檔案

## §2 架構圖

```
AdminChatPanel (Sprint 55-1 改)
   ↓ 偵測 /extension command
   ↓ parseExtensionCommand(input)
   ↓ fetch POST /api/admin/extensions/generate
   ↓
POST /api/admin/extensions/generate (Sprint 55-0 新建)
   ↓ 驗證 admin + isPathAllowed
   ↓ ExtensionTemplate.generate({ name, fields })
   ↓ 產 8 個檔案內容
   ↓ processExtensionGeneration(files, name, { force })
   ↓ ├─ interceptWriteFile (path 防護)
   ↓ ├─ writeExtensionFile (寫磁碟)
   ↓ └─ validateThreeLayers (Sprint 53-2)
   ↓       ├─ validateSpecLayer (Zod schema)
   ↓       ├─ validateManifestLayer (Zod schema)
   ↓       └─ validateTscCompile (Sprint 53-2 新增)
   ↓
extensions/<name>/ 出現 8 個檔案 ✅
   ↓
回傳 success + 8 個檔案清單
   ↓
AdminChatPanel 顯示「✅ 已建立 extension 'product'，8 個檔案於 extensions/product/」
```

## §3 檔案結構

### 3.1 新建檔案

```
app/api/admin/extensions/generate/route.ts     # POST handler
lib/ai/agent-sdk/extension-template.ts        # 8 檔案模板生成器
app/api/admin/extensions/generate/route.test.ts # POST handler 測試
lib/ai/agent-sdk/extension-template.test.ts    # 模板生成器測試
tests/extension-flow-e2e-guard.test.ts         # 端到端守護測試
app/admin/_components/admin-chat-extension-cmd-guard.test.ts # chat panel 守護
```

### 3.2 修改檔案

```
app/admin/_components/admin-chat-panel.tsx    # handleExtensionCommand 真 fetch endpoint
```

## §4 ExtensionTemplate.generate() 設計

### 4.1 介面

```typescript
export interface ExtensionTemplateInput {
  name: string;       // "product"
  fields: string[];   // ["name", "price", "stock"] → 全部 default type=string
  force?: boolean;    // 允許覆寫
}

export interface ExtensionTemplateOutput {
  files: ExtensionFile[]; // 8 個檔案內容
}

export function generateExtensionTemplate(input: ExtensionTemplateInput): ExtensionTemplateOutput;
```

### 4.2 8 個檔案內容設計 (參考 todo extension)

| # | 路徑 | 內容 |
|---|---|---|
| 1 | `extensions/<name>/manifest.json` | 參考 todo manifest, hooks/actions/computed 依 fields 動態調整 |
| 2 | `extensions/<name>/<name>-spec.json` | model fields (admin 指定 + auto id + auto createdAt/updatedAt) |
| 3 | `extensions/<name>/hooks/before-create.ts` | 設定 createdAt/updatedAt |
| 4 | `extensions/<name>/actions/complete.ts` | 若 model 有 completed field 才生成 |
| 5 | `extensions/<name>/computed/remaining-days.ts` | 若 model 有 dueDate field 才生成 |
| 6 | `extensions/<name>/workflow/<name>-workflow.ts` | 簡單狀態機 draft → published |
| 7 | `extensions/<name>/examples/list-and-filter.ts` | API 呼叫範例 |
| 8 | `extensions/<name>/README.md` | 簡單 markdown |

### 4.3 Field type 推斷策略

| Field 名稱 | 推斷 Type | 理由 |
|---|---|---|
| 任何 `*Date`, `*date` | datetime | 日期 |
| `is*`, `has*`, `*Completed` | boolean | 布林 |
| `price`, `amount`, `count`, `*Count`, `stock`, `quantity` | number | 數字 |
| `description`, `content`, `notes`, `bio`, `text` | text | 長文字 |
| 其他 | string | 短字串 |

## §5 POST /api/admin/extensions/generate 設計

### 5.1 介面

```
POST /api/admin/extensions/generate
Content-Type: application/json

Request Body:
{
  "name": "product",
  "fields": ["name", "price", "stock"],
  "force": false  // optional
}

Response 200:
{
  "success": true,
  "extensionName": "product",
  "files": ["extensions/product/manifest.json", ...]
}

Response 400 (validation):
{
  "error": "Invalid extension name (must be kebab-case)"
}

Response 403 (not admin):
{
  "error": "Admin only"
}

Response 409 (already exists, no force):
{
  "error": "Extension 'product' already exists. Use --force to overwrite."
}

Response 500 (validation failed):
{
  "error": "Three-layer validation failed",
  "details": ["manifest layer: ...", "spec layer: ..."]
}
```

### 5.2 流程

```typescript
export async function POST(req: NextRequest) {
  // 1. auth check
  const user = await requireUser().catch(() => null);
  if (!user) return 401;
  if (!(await isAdmin())) return 403;

  // 2. parse body
  const body = await req.json();
  const { name, fields, force } = body;

  // 3. validate name
  if (!name || !/^[a-z][a-z0-9-]*$/.test(name)) {
    return 400; // must be kebab-case
  }

  // 4. check overwrite
  const exists = existsSync(`extensions/${name}/manifest.json`);
  if (exists && !force) return 409;

  // 5. generate template
  const { files } = generateExtensionTemplate({ name, fields, force });

  // 6. process (path 防護 + write + three-layer validate)
  const result = await processExtensionGeneration(
    files.map(f => ({ path: f.path, content: f.content })),
    name,
    { force },
  );

  if (!result.success) return 500;

  return 200; // success
}
```

## §6 AdminChatPanel 改動設計

### 6.1 handleExtensionCommand 改為真 fetch

```typescript
const handleExtensionCommand = async (text: string): Promise<void> => {
  if (!isExtensionCommand(text)) return;

  try {
    const parsed = parseExtensionCommand(text);

    if (parsed.action === 'help') {
      addMessage({ role: 'assistant', content: HELP_TEXT });
      return;
    }

    if (parsed.action === 'create' && parsed.name) {
      // 顯示 loading
      addMessage({ role: 'assistant', content: `🔨 正在建立 extension '${parsed.name}'...` });

      const res = await fetch('/api/admin/extensions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: parsed.name,
          fields: parsed.fields,
          force: parsed.force,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        addMessage({
          role: 'assistant',
          content: `✅ 已建立 extension '${data.extensionName}'，${data.files.length} 個檔案於 extensions/${data.extensionName}/\n\n檔案:\n${data.files.map(f => \`- \${f}\`).join('\n')}`,
        });
      } else {
        addMessage({
          role: 'assistant',
          content: `❌ 建立失敗: ${data.error}`,
        });
      }
    }
  } catch (err) {
    addMessage({ role: 'assistant', content: `❌ 錯誤: ${err.message}` });
  }
};
```

### 6.2 handleSubmit 改為 async + 等 handleExtensionCommand

```typescript
const handleSubmit = async () => {
  if (isExtensionCommand(input)) {
    await handleExtensionCommand(input);
    setInput('');
    return;
  }
  // ... 原本 send flow
};
```

## §7 守護測試設計

### 7.1 extension-flow-e2e-guard.test.ts

**對應 Sprint 53-2 反思**: 守護測試防止下次「再次留尾」

```typescript
describe('Sprint 55 — Extension Generation 端到端守護', () => {
  it('應有 POST /api/admin/extensions/generate/route.ts', () => { ... });
  it('POST handler 應 requireUser + isAdmin', () => { ... });
  it('POST handler 應驗證 name kebab-case', () => { ... });
  it('POST handler 應有 overwrite check', () => { ... });
  it('POST handler 應呼叫 processExtensionGeneration', () => { ... });

  it('應有 extension-template.ts (8 檔案模板生成器)', () => { ... });
  it('generateExtensionTemplate 應產 8 個檔案', () => { ... });
  it('field type 推斷正確', () => { ... });

  it('AdminChatPanel handleExtensionCommand 應真 fetch endpoint', () => { ... });
  it('AdminChatPanel 應 await handleExtensionCommand', () => { ... });
});
```

### 7.2 extension-template.test.ts

```typescript
describe('generateExtensionTemplate', () => {
  it('應產 8 個檔案', () => { ... });
  it('應推斷 field type (price → number)', () => { ... });
  it('應跳過 actions/complete.ts 若無 completed field', () => { ... });
  it('應跳過 computed/remaining-days.ts 若無 dueDate field', () => { ... });
  it('manifest.json 應通過 ExtensionManifestSchema', () => { ... });
});
```

### 7.3 POST handler 測試

```typescript
describe('POST /api/admin/extensions/generate', () => {
  it('401 未登入', () => { ... });
  it('403 非 admin', () => { ... });
  it('400 invalid name', () => { ... });
  it('409 已存在無 force', () => { ... });
  it('200 成功 + 8 檔案', () => { ... });
});
```

## §8 風險與緩解

| 風險 | 緩解 |
|---|---|
| 模板跟真實 todo extension 不一致 | 沿用 todo 結構, 從 extensions/todo/ 直接讀 |
| Field type 推斷錯誤 | 推斷失敗 default to string (保守) |
| 三層驗證失敗 | 用既有 processExtensionGeneration (已驗證) |
| AdminChatPanel 改壞既有 chat | 改最小範圍 (只改 handleExtensionCommand + handleSubmit) |
| 沒有 processExtensionGeneration | 已有 Sprint 53-1, 確認存在 |

## §9 計畫

| Stage | 工作 | 預估時間 |
|---|---|---|
| **55-0 設計** | 本文件 | ✅ |
| **55-1 執行** | extension-template.ts + route.ts + tests | ~30 分鐘 |
| **55-2 整合** | AdminChatPanel + 守護測試 | ~20 分鐘 |
| **55-3 Submit** | reflection + 提交 | ~10 分鐘 |
| **合計** | | ~1 小時 |

剩 1 小時進產品化 (Landing Page + LICENSE + 結構化 logging)
EOF