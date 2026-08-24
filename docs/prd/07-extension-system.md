# PRD: Extension System (Module 6)

> **模組代號**：M6
> **模組名稱**：Extension System（Extension 管理）
> **版本**：1.0.0
> **最後更新**：2026-08-24
> **狀態**：Ready for Sprint 2

---

## 1. 模組概述

### 1.1 模組目標

M6（Extension System）提供 ai-headless 框架的 **Extension 管理 UI**。包含：

1. **Extension 列表**：顯示所有已安裝的 Extension
2. **啟用 / 停用**：一鍵開關 Extension
3. **配置管理**：編輯用戶可改的配置
4. **Extension 詳情頁**：查看 manifest、權限、mountPoints
5. **Extension 自動安裝**：AI 生成的 Extension 自動入庫

### 1.2 模組邊界

| 屬於 M6 | 不屬於 M6 |
|---|---|
| Extension 管理 UI | Extension Loader 邏輯（M1）|
| Extension CRUD | Extension API 定義（M1）|
| Extension 配置編輯 | Extension 規範文檔（[extension-spec.md](../../specs/extension-spec.md)）|

### 1.3 依賴

- **依賴**：M1（Extension API）、M2（Auth）、M5（AI Chat，AI 生成 Extension 入口）
- **被依賴**：無

---

## 2. 功能清單

### 2.1 FR-1：Extension 列表

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-1.1 | `/admin/extensions` 列表頁 | P0 | 1 |
| FR-1.2 | 顯示 Extension 名稱、版本、狀態、描述 | P0 | 1 |
| FR-1.3 | 啟用 / 停用開關 | P0 | 1 |
| FR-1.4 | 點擊進入詳情頁 | P0 | 0.5 |
| FR-1.5 | 顯示最後更新時間 | P0 | 0.5 |

### 2.2 FR-2：Extension 詳情

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-2.1 | 基本資訊（name、version、author、license） | P0 | 1 |
| FR-2.2 | Manifest 完整顯示 | P0 | 1 |
| FR-2.3 | 權限清單 | P0 | 0.5 |
| FR-2.4 | Mount Points | P0 | 0.5 |
| FR-2.5 | 配置 Schema 顯示 | P0 | 1 |
| FR-2.6 | 卸載按鈕（高危，需確認） | P0 | 1 |

### 2.3 FR-3：配置管理

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-3.1 | 從 configSchema 動態生成表單 | P0 | 3 |
| FR-3.2 | 配置儲存 | P0 | 1 |
| FR-3.3 | 配置變更觸發 onConfigChange | P0 | 2 |
| FR-3.4 | 配置預設值顯示 | P0 | 0.5 |

### 2.4 FR-4：Extension 自動入庫

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-4.1 | AI 生成 Extension → 自動寫入 `extensions/` | P0 | 1 |
| FR-4.2 | 自動建立 Extension DB record | P0 | 1 |
| FR-4.3 | 自動啟用 | P0 | 0.5 |
| FR-4.4 | 安裝日誌 | P1 | 2 |

### 2.5 FR-5：Extension 移除

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-5.1 | 卸載確認 dialog | P0 | 1 |
| FR-5.2 | 從 `extensions/` 移除（可選保留備份） | P0 | 1 |
| FR-5.3 | 從 DB 移除 Extension record | P0 | 0.5 |
| FR-5.4 | 觸發 onUnload | P0 | 1 |
| FR-5.5 | 卸載日誌 | P1 | 1 |

### 2.6 FR-6：Extension 自動推薦（AI）

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-6.1 | 基於 aiHints.prompts 推薦 | P2 | 3 |
| FR-6.2 | 用戶輸入需求 → 推薦已有 Extension | P2 | 3 |
| FR-6.3 | 一鍵安裝推薦的 Extension | P2 | 2 |

---

## 3. 非功能需求

### 3.1 性能

- 列表載入 < 200ms
- 啟用 / 停用響應 < 500ms

### 3.2 安全

- 卸載高危操作需輸入「UNINSTALL」確認
- 配置變更需要權限檢查
- 不可卸載系統必要 Extension

### 3.3 UX

- Extension 圖標統一用 lucide-react
- 啟用 / 停用開關要有 loading 狀態
- 卸載後自動 refresh 列表

---

## 4. 介面設計

### 4.1 Extension 列表頁

```
┌─────────────────────────────────────────────────────────┐
│ Extension 管理                         [從 Marketplace 安裝] │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [📝] Blog 文章管理                        [啟用 ●]   │ │
│ │      版本 1.0.0  •  作者 ai-headless Team  •  Active  │ │
│ │      提供完整的 Blog CRUD，含富文本編輯器、分類、標籤  │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ [✅] 待辦事項                          [啟用 ●]      │ │
│ │      版本 1.0.0  •  作者 AI 生成     •  Active       │ │
│ │      待辦事項管理，含優先級、截止日期、完成狀態       │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Extension 詳情頁

```
┌─────────────────────────────────────────────────────────┐
│ [← 返回]  Blog 文章管理                       [卸載]    │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────┬─────────────────────────────┐ │
│ │ 基本資訊             │  統計                       │ │
│ │ • 名稱: blog         │  • 安裝時間: 2026-08-24     │ │
│ │ • 版本: 1.0.0        │  • 狀態: Active             │ │
│ │ • 類型: CRUD         │  • 自動生成: 否             │ │
│ │ • 作者: ai-headless  │                              │ │
│ └─────────────────────┴─────────────────────────────┘ │
│                                                          │
│ 權限                                                     │
│ ☑ blog.read    ☑ blog.create    ☑ blog.update            │
│ ☑ blog.delete                                                │
│                                                          │
│ Mount Points                                              │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Slot: admin-sidebar                                  │ │
│ │ Component: BlogMenu                                  │ │
│ │ Order: 10                                            │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ 配置                                                     │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ ☑ 啟用留言功能                                       │ │
│ │ 每頁文章數: [10___]                                   │ │
│ │                                  [取消]  [儲存]      │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ Manifest                                                  │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ {                                                    │ │
│ │   "name": "blog",                                    │ │
│ │   "version": "1.0.0",                                │ │
│ │   ...                                                │ │
│ │ }                                                    │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 4.3 元件

```tsx
// app/(admin)/extensions/page.tsx
'use client';

import { ExtensionList } from '@/components/extensions/extension-list';

export default function ExtensionsPage() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Extension 管理</h1>
        <Button variant="outline">
          <Plus className="w-4 h-4 mr-1" />
          從 Marketplace 安裝
        </Button>
      </div>
      <ExtensionList />
    </div>
  );
}
```

```tsx
// components/extensions/extension-list.tsx
'use client';

import { useExtensions } from '@/lib/extensions/use-extensions';
import { ExtensionCard } from './extension-card';

export function ExtensionList() {
  const { extensions, toggleExtension, isLoading } = useExtensions();
  
  if (isLoading) return <Skeleton />;
  
  return (
    <div className="space-y-2">
      {extensions.map(ext => (
        <ExtensionCard
          key={ext.name}
          extension={ext}
          onToggle={() => toggleExtension(ext.name, !ext.enabled)}
        />
      ))}
    </div>
  );
}
```

```tsx
// components/extensions/extension-card.tsx
'use client';

import Link from 'next/link';
import { Switch } from '@/components/ui/switch';

interface ExtensionCardProps {
  extension: Extension;
  onToggle: () => void;
}

export function ExtensionCard({ extension, onToggle }: ExtensionCardProps) {
  return (
    <Link href={`/admin/extensions/${extension.name}`}>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-md bg-primary-100 flex items-center justify-center">
              <DynamicIcon name={extension.icon || 'puzzle'} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">{extension.displayName}</h3>
              <p className="text-sm text-primary-500">
                版本 {extension.version} • {extension.author || '未知作者'}
              </p>
              <p className="text-sm text-primary-700 mt-1">{extension.description}</p>
            </div>
          </div>
          <Switch checked={extension.enabled} onCheckedChange={onToggle} />
        </div>
      </Card>
    </Link>
  );
}
```

### 4.4 動態配置表單

```tsx
// components/extensions/config-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface ConfigFormProps {
  schema: any;          // JSON Schema
  defaultValues: any;
  onSubmit: (values: any) => Promise<void>;
}

export function ConfigForm({ schema, defaultValues, onSubmit }: ConfigFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    defaultValues,
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {Object.entries(schema.properties).map(([key, propSchema]: any) => (
        <div key={key}>
          <Label>{propSchema.title || key}</Label>
          {propSchema.type === 'boolean' ? (
            <Switch {...register(key)} />
          ) : propSchema.type === 'number' ? (
            <Input type="number" {...register(key, { valueAsNumber: true })} />
          ) : (
            <Input type={propSchema.format === 'password' ? 'password' : 'text'} {...register(key)} />
          )}
          {propSchema.description && (
            <p className="text-xs text-primary-500 mt-1">{propSchema.description}</p>
          )}
        </div>
      ))}
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '儲存中...' : '儲存'}
        </Button>
      </div>
    </form>
  );
}
```

---

## 5. 資料模型

```prisma
// Extension 已安裝記錄
model Extension {
  id           String   @id @default(cuid())
  name         String   @unique           // "blog"
  displayName  String                     // "Blog 文章管理"
  version      String                     // "1.0.0"
  description  String   @db.Text
  author       String?
  license      String?
  icon         String?
  type         String                     // "crud-extension" | ...
  enabled      Boolean  @default(true)
  
  manifest     Json                       // 完整 manifest
  config       Json     @default("{}")    // 用戶配置
  sourcePath   String                     // extensions/blog/
  
  installedAt  DateTime @default(now())
  updatedAt    DateTime @updatedAt
  uninstalledAt DateTime?
  
  // AI 生成記錄
  generatedByAI Boolean @default(false)
  generatedByUserId String?
  
  @@index([enabled])
  @@map("extensions")
}

// Extension 卸載日誌
model ExtensionUninstallLog {
  id          String   @id @default(cuid())
  extensionName String
  userId      String
  reason      String?
  configSnapshot Json?
  createdAt   DateTime @default(now())
  
  @@map("extension_uninstall_logs")
}
```

---

## 6. API 設計

### 6.1 列表 Extensions

```typescript
// app/api/admin/extensions/route.ts
export async function GET() {
  const session = await auth();
  if (!await checkPermission(session.user, 'extension.read')) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  const extensions = await prisma.extension.findMany({
    where: { uninstalledAt: null },
    orderBy: { installedAt: 'desc' },
  });
  
  return Response.json({ data: extensions });
}
```

### 6.2 啟用 / 停用

```typescript
// app/api/admin/extensions/[name]/route.ts
export async function PATCH(
  request: Request,
  { params }: { params: { name: string } }
) {
  const { enabled } = await request.json();
  
  await prisma.extension.update({
    where: { name: params.name },
    data: { enabled },
  });
  
  // 觸發 onLoad / onUnload
  if (enabled) {
    await loadExtension(params.name);
  } else {
    await unloadExtension(params.name);
  }
  
  return Response.json({ success: true });
}
```

### 6.3 更新配置

```typescript
// app/api/admin/extensions/[name]/config/route.ts
export async function PUT(
  request: Request,
  { params }: { params: { name: string } }
) {
  const config = await request.json();
  
  const ext = await prisma.extension.update({
    where: { name: params.name },
    data: { config },
  });
  
  // 觸發 onConfigChange
  await triggerConfigChange(params.name, config);
  
  return Response.json({ success: true, extension: ext });
}
```

### 6.4 卸載

```typescript
// app/api/admin/extensions/[name]/route.ts
export async function DELETE(
  request: Request,
  { params }: { params: { name: string } }
) {
  const user = await auth();
  
  // 高危操作：先 log
  const ext = await prisma.extension.findUnique({
    where: { name: params.name },
  });
  
  await prisma.extensionUninstallLog.create({
    data: {
      extensionName: params.name,
      userId: user.id,
      configSnapshot: ext.config,
    },
  });
  
  // 軟刪除（保留記錄）
  await prisma.extension.update({
    where: { name: params.name },
    data: { uninstalledAt: new Date(), enabled: false },
  });
  
  // 卸載檔案
  await unloadExtension(params.name);
  
  return Response.json({ success: true });
}
```

---

## 7. 使用者故事

### 7.1 US-M6-01：查看 Extensions

> **作為** 用戶
> **我想要** 看所有已安裝的 Extensions
> **以便** 知道系統有什麼功能

**驗收標準**：
- [ ] `/admin/extensions` 顯示所有 Extensions
- [ ] 每個顯示名稱、描述、狀態
- [ ] 點擊進入詳情頁

### 7.2 US-M6-02：啟用 / 停用

> **作為** 用戶
> **我想要** 開關 Extension
> **以便** 控制功能啟用

**驗收標準**：
- [ ] 點擊 Switch → 立即啟用 / 停用
- [ ] 啟用後側邊欄出現 Extension 選單
- [ ] 停用後選單消失

### 7.3 US-M6-03：配置 Extension

> **作為** 用戶
> **我想要** 修改 Extension 的配置
> **以便** 客製化行為

**驗收標準**：
- [ ] 詳情頁有配置區塊
- [ ] 從 configSchema 動態生成表單
- [ ] 儲存後配置立即生效

### 7.4 US-M6-04：AI 生成後自動安裝

> **作為** 用戶
> **我想要** 叫 AI 生成 Extension 後自動安裝
> **以便** 我立刻能使用

**驗收標準**：
- [ ] AI 生成 Extension → 自動入庫
- [ ] 自動啟用
- [ ] 在 Extensions 列表顯示

---

## 8. 測試計劃

### 8.1 元件測試

- [ ] ExtensionCard 互動
- [ ] Switch 啟用 / 停用
- [ ] ConfigForm 動態生成

### 8.2 整合測試

- [ ] 啟用 → onLoad 觸發
- [ ] 停用 → onUnload 觸發
- [ ] 配置變更 → onConfigChange 觸發

### 8.3 E2E 測試

- [ ] 完整流程：AI 生成 → 自動安裝 → 啟用 → 使用

---

## 9. 開發計劃

### Sprint 2

| Task | FR | SP |
|---|---|---|
| Prisma model | — | 1 |
| Extension 列表頁 | FR-1 全 | 2 |
| Extension 詳情頁 | FR-2 全 | 3 |
| 啟用 / 停用 UI + API | FR-1.3 + API | 2 |
| 配置管理 UI + API | FR-3 全 | 3 |
| 卸載流程 + API | FR-5 全 | 2 |
| AI 生成自動入庫 | FR-4 全 | 2 |
| 測試 | — | 2 |

**總計**：17 SP

---

## 10. 相關文檔

- 📐 [系統架構](../system-design.md)
- 🎨 [UX/UI 設計](../DESIGN.md)
- 🔌 [Extension 開發規範](../specs/extension-spec.md)
- 📋 [M1 PRD](./01-framework-core.md)
- 📋 [M5 PRD](./06-ai-chat.md)
- 📊 [Backlog](../backlog.md)