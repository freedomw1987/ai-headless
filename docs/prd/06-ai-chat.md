# PRD: AI Chat (Module 5)

> **模組代號**：M5
> **模組名稱**：AI Chat（AI 對話界面）
> **版本**：1.0.0
> **最後更新**：2026-08-24
> **狀態**：Ready for Sprint 1

---

## 1. 模組概述

### 1.1 模組目標

M5（AI Chat）提供 ai-headless 框架的**AI 對話界面**。用戶透過 chat UI：

1. 輸入自然語言需求（例如「幫我做個待辦事項」）
2. 看 AI 反問釐清需求
3. 看 AI 執行 pipeline（生成 JSON → 編譯代碼 → 跑測試）
4. 看到功能上線，並可下載生成的 JSON

### 1.2 為什麼 M5 重要？

M5 是用戶**唯一直接接觸 AI** 的地方。整個 AI Pipeline 的入口。Chat 體驗決定了整個框架好不好用。

### 1.3 模組邊界

| 屬於 M5 | 不屬於 M5 |
|---|---|
| Chat UI | AI Provider（M4） |
| 串流回應渲染 | pi agent 邏輯（M1） |
| 訊息歷史 | Extension 系統（M6） |
| Pipeline 進度顯示 | |

### 1.4 依賴

- **依賴**：M1（Pipeline）、M4（Provider）、M2（Auth）
- **被依賴**：無

---

## 2. 功能清單

### 2.1 FR-1：Chat 界面

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-1.1 | Chat 視窗（全屏） | P0 | 2 |
| FR-1.2 | 訊息列表（user / assistant 區分） | P0 | 1 |
| FR-1.3 | 輸入框（自動調整高度） | P0 | 1 |
| FR-1.4 | 發送按鈕 / Enter 送出 | P0 | 0.5 |
| FR-1.5 | 自動滾動到最新訊息 | P0 | 0.5 |
| FR-1.6 | 載入狀態（typing indicator） | P0 | 0.5 |

### 2.2 FR-2：Pipeline 進度

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-2.1 | 顯示當前 Stage（分析 / 生成 JSON / 編譯 / 測試） | P0 | 2 |
| FR-2.2 | 進度條（百分比） | P0 | 1 |
| FR-2.3 | 每個 Stage 的詳細 log（可展開） | P1 | 2 |
| FR-2.4 | 錯誤訊息友善顯示 | P0 | 1 |

### 2.3 FR-3：訊息歷史

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-3.1 | 訊息持久化（DB） | P0 | 1 |
| FR-3.2 | 重新載入歷史對話 | P0 | 1 |
| FR-3.3 | 多對話（session）管理 | P1 | 3 |
| FR-3.4 | 刪除對話 | P1 | 1 |

### 2.4 FR-4：AI 回應互動

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-4.1 | 串流回應（逐字顯示） | P0 | 2 |
| FR-4.2 | Markdown 渲染 | P0 | 1 |
| FR-4.3 | Code block 語法高亮 | P0 | 1 |
| FR-4.4 | 複製按鈕 | P0 | 0.5 |
| FR-4.5 | JSON 規範顯示（可下載） | P0 | 2 |

### 2.5 FR-5：交付展示

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-5.1 | 「功能已上線」卡片 | P0 | 1 |
| FR-5.2 | 「下載 JSON」按鈕 | P0 | 0.5 |
| FR-5.3 | 「查看交付摘要」連結 | P0 | 0.5 |
| FR-5.4 | 「前往功能」連結 | P0 | 0.5 |

---

## 3. 非功能需求

### 3.1 性能

- 首屏載入 < 500ms
- 訊息發送延遲 < 200ms
- 串流回應第一個字 < 1s

### 3.2 可用性

- 響應式（手機 / 平板 / 桌面）
- 鍵盤快捷鍵（Enter 送出、Shift+Enter 換行）
- 自動聚焦輸入框

### 3.3 錯誤處理

- 網路斷線提示
- AI 錯誤友善訊息
- 重試機制

---

## 4. 介面設計

### 4.1 Chat 介面佈局

```
┌─────────────────────────────────────────────┐
│ AI Chat                       [清空對話] [≡]  │  ← Header
├─────────────────────────────────────────────┤
│                                              │
│  [User] 幫我做個待辦事項                       │
│                                              │
│  [Assistant]                                  │
│  好的！讓我先了解一些細節：                      │
│  1. 需要哪些欄位？（標題、描述、截止日期...）   │
│  2. 需要提醒功能嗎？                            │
│                                              │
│  ── Stage 1: 需求分析 ─────────────────        │
│  ── Stage 2: 反問釐清 ─────────────────        │
│  ── Stage 3: 生成 JSON ─────────────────      │
│  ── Stage 4: TDD Gate ──────────── ✓         │
│  ── Stage 5: 編譯代碼 ──────────── ⟳         │
│  ── Stage 6: Lint ──────────────── ⏸          │
│  ── Stage 7: Regression ─────────── ⏸          │
│  ── Stage 8: Reviewer ──────────── ⏸          │
│                                              │
│  [User] 標題、描述、截止日期、優先級、完成狀態   │
│                                              │
│  [Assistant]                                  │
│  ✅ 功能已上線！                              │
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │ 📦 待辦事項 Extension                 │   │
│  │ Status: Active                        │   │
│  │ Migration: 20260824_add_todo          │   │
│  │ Files: 8 created                      │   │
│  │                                       │   │
│  │ [下載 JSON] [前往功能] [查看摘要]      │   │
│  └─────────────────────────────────────┘   │
│                                              │
├─────────────────────────────────────────────┤
│ [輸入你的需求...]              [↑ 送出]      │
└─────────────────────────────────────────────┘
```

### 4.2 Chat 元件結構

```tsx
// app/(admin)/ai-chat/page.tsx
'use client';

import { ChatWindow } from '@/components/chat/chat-window';

export default function AIChatPage() {
  return (
    <div className="h-screen flex flex-col">
      <ChatWindow />
    </div>
  );
}
```

```tsx
// components/chat/chat-window.tsx
'use client';

import { useChat } from '@/lib/chat/use-chat';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { PipelineProgress } from './pipeline-progress';

export function ChatWindow() {
  const { messages, sendMessage, status } = useChat();
  
  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      {status === 'running' && <PipelineProgress status={status} />}
      <ChatInput onSend={sendMessage} disabled={status === 'running'} />
    </div>
  );
}
```

### 4.3 串流回應

```tsx
// components/chat/message-bubble.tsx
'use client';

import { useEffect, useState } from 'react';
import { Streamdown } from 'streamdown';  // Markdown 串流渲染

export function MessageBubble({ message }: { message: ChatMessage }) {
  const [displayed, setDisplayed] = useState(message.content);
  
  // 串流時逐字顯示
  useEffect(() => {
    if (message.streaming) {
      setDisplayed(prev => prev + message.delta);
    }
  }, [message.delta]);
  
  return (
    <div className={cn(
      "p-4 rounded-lg",
      message.role === 'user' ? 'bg-accent-500 text-white ml-auto' : 'bg-primary-100'
    )}>
      <Streamdown>{displayed}</Streamdown>
    </div>
  );
}
```

### 4.4 Pipeline 進度

```tsx
// components/chat/pipeline-progress.tsx
'use client';

import { CheckCircle2, Loader2, Circle } from 'lucide-react';

const STAGES = [
  { id: 'analyze', label: '需求分析' },
  { id: 'clarify', label: '反問釐清' },
  { id: 'spec', label: '生成 JSON' },
  { id: 'tdd', label: 'TDD Gate' },
  { id: 'code', label: '編譯代碼' },
  { id: 'lint', label: 'Lint Gate' },
  { id: 'regression', label: 'Regression' },
  { id: 'review', label: 'Reviewer' },
];

export function PipelineProgress({ currentStage }: { currentStage?: string }) {
  return (
    <div className="border-t border-primary-200 p-4 space-y-2">
      {STAGES.map((stage) => {
        const status = getStageStatus(stage.id, currentStage);
        return (
          <div key={stage.id} className="flex items-center gap-2">
            {status === 'done' && <CheckCircle2 className="w-4 h-4 text-success-500" />}
            {status === 'running' && <Loader2 className="w-4 h-4 text-accent-500 animate-spin" />}
            {status === 'pending' && <Circle className="w-4 h-4 text-primary-300" />}
            <span className={cn(
              "text-sm",
              status === 'running' && "font-semibold",
              status === 'pending' && "text-primary-400"
            )}>
              {stage.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
```

### 4.5 交付卡片

```tsx
// components/chat/delivery-card.tsx
'use client';

import { Download, ExternalLink, FileText } from 'lucide-react';
import Link from 'next/link';

interface DeliveryCardProps {
  title: string;
  status: string;
  migrationId?: string;
  filesCreated: number;
  jsonSpec: any;
  featurePath: string;
  summaryPath: string;
}

export function DeliveryCard({ title, jsonSpec, featurePath, summaryPath, filesCreated }: DeliveryCardProps) {
  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(jsonSpec, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${jsonSpec.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <Card className="p-4 border-success-500">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-5 h-5 text-success-500" />
        <h3 className="font-semibold">✅ {title}</h3>
      </div>
      
      <dl className="space-y-1 text-sm mb-4">
        <div className="flex justify-between">
          <dt className="text-primary-500">檔案建立：</dt>
          <dd>{filesCreated} 個</dd>
        </div>
      </dl>
      
      <div className="flex gap-2">
        <Button onClick={handleDownload} variant="outline">
          <Download className="w-4 h-4 mr-1" />
          下載 JSON
        </Button>
        <Link href={featurePath}>
          <Button variant="outline">
            <ExternalLink className="w-4 h-4 mr-1" />
            前往功能
          </Button>
        </Link>
        <Link href={summaryPath}>
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-1" />
            查看摘要
          </Button>
        </Link>
      </div>
    </Card>
  );
}
```

---

## 5. 資料模型

```prisma
model ChatSession {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  title     String?  // 自動從第一條訊息生成
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  messages  ChatMessage[]
  
  @@index([userId])
  @@map("chat_sessions")
}

model ChatMessage {
  id        String   @id @default(cuid())
  sessionId String
  session   ChatSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  role      String   // "user" | "assistant" | "system"
  content   String   @db.Text
  metadata  Json?    // 包含 pipeline stage、json spec、errors 等
  createdAt DateTime @default(now())
  
  @@index([sessionId, createdAt])
  @@map("chat_messages")
}
```

---

## 6. API 設計

### 6.1 發送訊息

```typescript
// app/api/ai/chat/route.ts
import { auth } from '@/lib/auth';
import { runAgentStream } from '@/lib/ai/agent-runner';

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return new Response('Unauthorized', { status: 401 });
  
  const { sessionId, message } = await request.json();
  
  // 儲存用戶訊息
  await prisma.chatMessage.create({
    data: { sessionId, role: 'user', content: message },
  });
  
  // 串流回應
  const stream = await runAgentStream({
    agent: 'json-spec-compiler',
    userMessage: message,
    sessionId,
    userId: session.user.id,
  });
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

---

## 7. 使用者故事

### 7.1 US-M5-01：用戶發送需求

> **作為** 用戶
> **我想要** 在 chat 輸入自然語言需求
> **以便** AI 幫我生成功能

**驗收標準**：
- [ ] Chat 輸入框可輸入多行
- [ ] Enter 送出，Shift+Enter 換行
- [ ] 發送後看到 AI loading
- [ ] 串流回應逐字顯示

### 7.2 US-M5-02：看到 pipeline 進度

> **作為** 用戶
> **我想要** 看到 AI 正在做什麼
> **以便** 我知道什麼時候完成

**驗收標準**：
- [ ] 顯示 8 個 Stage 進度
- [ ] 當前 Stage 有 spinner
- [ ] 完成 Stage 有 ✓
- [ ] 失敗 Stage 有 ✗ + 錯誤訊息

### 7.3 US-M5-03：下載 JSON

> **作為** 用戶
> **我想要** 下載 AI 生成的 JSON
> **以便** 我在 VSCode 打開看

**驗收標準**：
- [ ] 功能完成後顯示「下載 JSON」按鈕
- [ ] 點擊 → 下載 `<name>.json`
- [ ] JSON 格式化（縮排 2 空格）

---

## 8. 測試計劃

### 8.1 元件測試

- [ ] ChatInput 各種互動（Enter、Shift+Enter、disabled）
- [ ] MessageBubble 串流渲染
- [ ] PipelineProgress 狀態切換

### 8.2 整合測試

- [ ] 完整對話流程（mock pi agent）
- [ ] 訊息持久化
- [ ] 多 session 切換

### 8.3 E2E 測試

- [ ] 用戶輸入需求 → 看到功能上線 → 下載 JSON

---

## 9. 開發計劃

### Sprint 1

| Task | FR | SP |
|---|---|---|
| ChatWindow 容器 | FR-1.1~1.6 | 2 |
| MessageList + MessageBubble | FR-1.2, FR-4.1 | 2 |
| ChatInput | FR-1.3, FR-1.4 | 1 |
| PipelineProgress | FR-2 全 | 2 |
| 串流 API route | — | 1 |
| Markdown 渲染（Streamdown） | FR-4.2 | 1 |
| Code 高亮 | FR-4.3 | 0.5 |
| 交付卡片 | FR-5 全 | 2 |
| ChatSession + ChatMessage 模型 | — | 1 |
| 訊息持久化 | FR-3.1 | 1 |
| 測試 | — | 2 |

**總計**：16 SP

---

## 10. 相關文檔

- 📐 [系統架構](../system-design.md)
- 🎨 [UX/UI 設計](../DESIGN.md)
- 📋 [M1 PRD](./01-framework-core.md)
- 📋 [M2 PRD](./03-auth.md)
- 📋 [M4 PRD](./05-ai-config.md)
- 📊 [Backlog](../backlog.md)