# PRD: AI Config (Module 4)

> **模組代號**：M4
> **模組名稱**：AI Config（AI 模型配置）
> **版本**：2.0.0
> **最後更新**：2026-08-30
> **狀態**：Sprint 43 開工中（v2.0 — 加 Custom LLM Endpoint 支援）

## 版本歷史

| 版本 | 日期 | 變更 |
|---|---|---|
| 1.0.0 | 2026-08-24 | 初版（OpenAI / Claude 二選一）|
| **2.0.0** | **2026-08-30** | **加入 Custom LLM Endpoint 支援（openai-compatible / anthropic-compatible）** |

---

## 1. 模組概述

### 1.1 模組目標

M4（AI Config）提供 ai-headless 框架的**AI 模型管理**。包含：

1. **多 Provider 支援**：4 種 Provider 類型
   - `openai` — OpenAI 原生（api.openai.com）
   - `claude` — Anthropic 原生（api.anthropic.com）
   - `openai-compatible` — 任意 OpenAI-compatible endpoint（OpenRouter / Azure / Groq / Together / Ollama / 自架 proxy）
   - `anthropic-compatible` — Anthropic-compatible endpoint（保留彈性）
2. **API Key 管理**：加密存儲用戶 API Key
3. **模型切換**：用戶可在不同 Provider / 模型間切換
4. **抽象層**：統一介面，方便未來加新 Provider
5. **Custom URL 支援**：用戶可設定任意 LLM endpoint URL（**Global URL 模式**，系統全域共用，所有 user 適用）

### 1.2 為什麼需要 AI Config？

| 沒有 AI Config 的問題 | 有 AI Config 的好處 |
|---|---|
| 寫死單一 provider | 用戶可選擇 |
| API Key 寫在 .env | 用戶在 UI 配置 |
| 切換模型要改代碼 | UI 一鍵切換 |
| API Key 明文存儲 | 加密存儲 |

### 1.3 模組邊界

| 屬於 M4 | 不屬於 M4 |
|---|---|
| Provider 抽象 | AI Chat UI（M5）|
| API Key 加密 | AI Pipeline（M1）|
| 模型配置 CRUD | 業務 Extension（M6）|

### 1.4 依賴

- **依賴**：M1、M2
- **被依賴**：M5（AI Chat）、M6（Extension）

---

## 2. 功能清單

### 2.1 FR-1：Provider 管理

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-1.1 | Provider 抽象 interface | P0 | 2 |
| FR-1.2 | OpenAI Provider 實作 | P0 | 2 |
| FR-1.3 | Anthropic Claude Provider 實作 | P0 | 2 |
| FR-1.4 | 統一 chat() / stream() 方法 | P0 | 2 |
| FR-1.5 | Token 計算（粗略估算） | P1 | 1 |
| FR-1.6 | 錯誤處理（rate limit、timeout、auth error） | P0 | 2 |

### 2.2 FR-2：API Key 管理

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-2.1 | 新增 API Key（OpenAI / Claude） | P0 | 1 |
| FR-2.2 | API Key 加密存儲（AES-256） | P0 | 2 |
| FR-2.3 | API Key 驗證（測試連線） | P0 | 1 |
| FR-2.4 | API Key 刪除 | P0 | 1 |
| FR-2.5 | 多 API Key per Provider | P1 | 2 |

### 2.3 FR-3：模型配置

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-3.1 | 設定預設模型 | P0 | 1 |
| FR-3.2 | 設定預設 Provider | P0 | 1 |
| FR-3.3 | 模型參數配置（temperature、max_tokens） | P1 | 2 |
| FR-3.4 | 模型清單（下拉選單） | P0 | 1 |

### 2.4 FR-4：UI 配置頁

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-4.1 | `/admin/ai-config` 頁面 | P0 | 2 |
| FR-4.2 | API Key 新增 / 刪除 / 測試 | P0 | 1 |
| FR-4.3 | 預設 Provider / 模型設定 | P0 | 1 |
| FR-4.4 | 使用統計（API calls / tokens） | P2 | 3 |

---

## 3. 非功能需求

### 3.1 安全

- **API Key 加密**：用 AES-256（加密密鑰從 env 讀取）
- **API Key 不 log**：Logger 自動 redact
- **API Key 不返回前端**：API 只回傳 metadata（provider name、model、createdAt）

### 3.2 性能

- Provider 抽象呼叫 overhead < 10ms
- API Key 解密 < 5ms

### 3.3 可擴展性

- 新增 Provider 只需實作 `BaseProvider` interface
- 自動註冊到 Provider Registry

---

## 4. 介面設計

### 4.0 Custom LLM Endpoint (v2.0 新增)

#### 4.0.1 設計動機

用戶需求（2026-08-30）：「除了 OpenAI / Claude，使用者可以自己設定 LLM API URL」。原因：

| 場景 | 需求 |
|---|---|
| 公司內部 LLM gateway | 用公司 proxy URL，所有員工連同一個 endpoint |
| OpenRouter / Azure / Groq | 一個 URL 連接多家 provider |
| 本地 LLM（Ollama / LM Studio） | 自架 URL，不需 API Key |
| 隱私合規 | 資料不能出公司，需走內部 endpoint |

#### 4.0.2 Global URL 設計

**重要約束**：Custom URL 是 **Global URL（系統全域共用）**，不是 per-user：

- 所有 admin user 共用同一個 Custom URL 設定
- 儲存在 `AIConfig` model 的 `userId = null` 那筆
- UI 隱藏 per-user Custom URL 設定（v2.0 不開放）

未來如需 per-user Custom URL，需重複複雜度評估。

#### 4.0.3 測試連線

Custom URL 設定頁提供「**測試連線**」按鈕，送一個 minimal request 驗證：

- OpenAI-compatible：`POST {baseUrl}/v1/chat/completions` 帶 minimal payload + `Authorization: Bearer {apiKey}` （用真 chat path 驗證連線）
- Anthropic-compatible：`POST {baseUrl}/anthropic/messages` 帶 minimal payload + `x-api-key: {apiKey}`

**UX 設計**：
- 連線成功：顯示 `✅ 連線成功（延遲 123ms，可用模型: gpt-4o, claude-3.5-sonnet）`
- 連線失敗：顯示具體原因（401 / 404 / timeout / DNS 失敗），不顯示 API Key 明文

#### 4.0.4 FR-4.5～4.10 新增 FR

| FR | 功能 | 優先級 | SP |
|---|---|---|---|
| FR-4.5 | Provider type 選擇（4 選 1 radio）| P0 | 0.5 |
| FR-4.6 | Custom URL 輸入欄位（顯示為 protocol + URL）| P0 | 1 |
| FR-4.7 | 「測試連線」按鈕（Custom URL 也適用）| P0 | 1 |
| FR-4.8 | OpenAI-compatible Provider 實作（Vercel AI SDK）| P0 | 2 |
| FR-4.9 | Anthropic-compatible Provider 實作 | P0 | 2 |
| FR-4.10 | 自動偵測可用模型（從 /models endpoint）| P1 | 1 |

### 4.1 Provider 抽象

```typescript
// lib/ai/providers/base.ts
export interface BaseProvider {
  name: string;                              // "openai" | "claude" | ...
  displayName: string;
  models: string[];                          // 可用模型清單
  
  chat(params: {
    messages: ChatMessage[];
    model: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<ChatResponse>;
  
  stream(params: ChatParams): AsyncIterable<ChatChunk>;
  
  validateApiKey(apiKey: string): Promise<boolean>;
  
  countTokens(text: string, model: string): number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

### 4.2 OpenAI Provider 範例

```typescript
// lib/ai/providers/openai.ts
import OpenAI from 'openai';

export class OpenAIProvider implements BaseProvider {
  name = 'openai';
  displayName = 'OpenAI';
  models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  
  private client: OpenAI;
  
  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }
  
  async chat(params: ChatParams): Promise<ChatResponse> {
    const response = await this.client.chat.completions.create({
      model: params.model,
      messages: params.messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: params.maxTokens,
    });
    
    return {
      content: response.choices[0].message.content,
      model: response.model,
      usage: {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      },
    };
  }
  
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      const client = new OpenAI({ apiKey });
      await client.models.list();
      return true;
    } catch {
      return false;
    }
  }
  
  countTokens(text: string, model: string): number {
    // 粗略估算：1 token ≈ 4 chars (English) or 1.5 chars (Chinese)
    return Math.ceil(text.length / 3);
  }
}
```

### 4.3 Claude Provider 範例

```typescript
// lib/ai/providers/claude.ts
import Anthropic from '@anthropic-ai/sdk';

export class ClaudeProvider implements BaseProvider {
  name = 'claude';
  displayName = 'Anthropic Claude';
  models = ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'];
  
  private client: Anthropic;
  
  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }
  
  async chat(params: ChatParams): Promise<ChatResponse> {
    const response = await this.client.messages.create({
      model: params.model,
      messages: params.messages.filter(m => m.role !== 'system'),
      system: params.messages.find(m => m.role === 'system')?.content,
      max_tokens: params.maxTokens ?? 4096,
      temperature: params.temperature ?? 0.7,
    });
    
    return {
      content: response.content[0].text,
      model: response.model,
      usage: {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }
  
  // ...
}
```

### 4.4 Provider Registry

```typescript
// lib/ai/index.ts
import { OpenAIProvider } from './providers/openai';
import { ClaudeProvider } from './providers/claude';

const providers: Record<string, new (apiKey: string) => BaseProvider> = {
  openai: OpenAIProvider,
  claude: ClaudeProvider,
};

export async function getProvider(providerName: string): Promise<BaseProvider> {
  const config = await prisma.aIConfig.findFirst({
    where: { provider: providerName, isDefault: true },
  });
  
  if (!config) throw new Error(`No API key for provider: ${providerName}`);
  
  const apiKey = decrypt(config.apiKey);
  const ProviderClass = providers[providerName];
  
  if (!ProviderClass) throw new Error(`Unknown provider: ${providerName}`);
  
  return new ProviderClass(apiKey);
}

export async function getDefaultProvider(): Promise<BaseProvider> {
  const defaultConfig = await prisma.aIConfig.findFirst({
    where: { isDefault: true },
  });
  
  if (!defaultConfig) throw new Error('No default AI provider configured');
  
  return getProvider(defaultConfig.provider);
}
```

### 4.5 加密 / 解密

```typescript
// lib/ai/crypto.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.AI_KEY_ENCRYPTION_KEY!;  // 32 bytes hex

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(ciphertext: string): string {
  const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
  
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(ENCRYPTION_KEY, 'hex'),
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

---

## 5. 資料模型

```prisma
enum AIProviderType {
  openai
  claude
  openai_compatible
  anthropic_compatible
}

model AIConfig {
  id          String         @id @default(cuid())
  userId      String?        @unique  // null = Global URL (所有 user 共用)
  
  type        AIProviderType @default(openai)  // v2.0 新增
  provider    String         // 邏輯 provider name: "openai" | "claude" | "custom"
  endpointUrl String?        // v2.0 新增: Custom URL (僅 type 為 openai_compatible / anthropic_compatible 時使用)
  apiKey      String         // 加密
  model       String         // "gpt-4o" | "claude-3-5-sonnet" 或 custom 輸入的 model
  isDefault   Boolean        @default(false)
  
  // 模型參數
  temperature Float          @default(0.7)
  maxTokens   Int            @default(4096)
  
  // 元數據
  label       String?        // 用戶給這個配置的名字，例如 "公司 OpenAI"
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  lastUsedAt  DateTime?
  
  @@unique([provider, label])
  @@map("ai_configs")
}

model AIUsageLog {
  id           String   @id @default(cuid())
  configId     String
  config       AIConfig @relation(fields: [configId], references: [id], onDelete: Cascade)
  userId       String?
  promptTokens Int
  completionTokens Int
  totalTokens  Int
  createdAt    DateTime @default(now())
  
  @@index([configId])
  @@index([createdAt])
  @@map("ai_usage_logs")
}
```

---

## 6. 使用者故事

### 6.1 US-M4-01：配置 OpenAI

> **作為** 管理員
> **我想要** 添加 OpenAI API Key
> **以便** AI Pipeline 能用 GPT-4o

**驗收標準**：
- [ ] `/admin/ai-config` 提供新增表單
- [ ] 填 API Key → 點擊「測試」→ 驗證成功
- [ ] 設定預設模型 → 儲存
- [ ] API Key 加密存儲（前端看不到明文）

### 6.2 US-M4-02：切換模型

> **作為** 管理員
> **我想要** 隨時切換用 OpenAI 或 Claude
> **以便** 根據任務選不同模型

**驗收標準**：
- [ ] 預設 Provider 可一鍵切換
- [ ] 切換後立即生效（下次 AI call 用新 provider）

### 6.3 US-M4-03：多 API Key

> **作為** 開發者
> **我想要** 為同一個 Provider 配多個 API Key
> **以便** 公司多個成員各自配自己的 key

**驗收標準**：
- [ ] 可新增多個 OpenAI config
- [ ] 標記哪個是預設
- [ ] 使用統計分 config 記錄

---

## 7. 測試計劃

### 7.1 單元測試

- [ ] `encrypt` / `decrypt` 正確性
- [ ] Provider `validateApiKey`（mock）
- [ ] `getProvider` 找不到 config 時拋錯
- [ ] Token 計算

### 7.2 整合測試

- [ ] 真實呼叫 OpenAI（用 test API key）
- [ ] API Key 加密後 DB 沒有明文

### 7.3 安全測試

- [ ] API Key 不出現在 log
- [ ] API Key 不返回前端 API
- [ ] 錯誤訊息不含 API Key

---

## 8. 開發計劃

### Sprint 43（v2.0 — 從零實作 + Custom URL）

**重要揭露（2026-08-30）**: PRD v1.0 雖然列了 `prisma.aIConfig`，但 Sprint 32 review 之前從未被使用。Sprint 43 是 **v2.0 全面重新實作** + 新增 Custom URL 支援。

| Commit | Task | FR | SP |
|---|---|---|---|
| A | PRD 05 改版 + Provider 介面重構 + Prisma schema 升級 | — | 3 |
| B | OpenAICompatibleProvider + AnthropicCompatibleProvider (Vercel AI SDK) | FR-4.8, FR-4.9 | 4 |
| C | Prisma migration + ProviderFactory 升級（type 判定） | — | 2 |
| D | `/admin/ai-config` UI（4-type radio + URL input + 「測試連線」）| FR-4.5, FR-4.6, FR-4.7 | 3 |
| E | 加密 / 錯誤處理 / log redaction 適配 + 守護測試 | — | 3 |
| **總計** | | | **15 SP** |

### Sprint 1（原 v1.0 計劃，保留供對照）

| Task | FR | SP |
|---|---|---|
| Provider abstract interface | FR-1.1, FR-1.4 | 2 |
| OpenAI Provider | FR-1.2 | 2 |
| Claude Provider | FR-1.3 | 2 |
| encrypt / decrypt utility | FR-2.2 | 1 |
| Prisma model + migration | — | 1 |
| `/admin/ai-config` 頁面 | FR-4.1 | 2 |
| API Key CRUD | FR-2.1~2.4 | 2 |
| 預設 Provider / 模型設定 | FR-3.1, FR-3.2 | 1 |
| 錯誤處理 | FR-1.6 | 1 |
| 測試 | — | 2 |

**總計**：16 SP

---

## 9. 相關文檔

- 📐 [系統架構](../system-design.md)
- 🎨 [UX/UI 設計](../DESIGN.md)
- 📋 [M1 PRD](./01-framework-core.md)
- 📋 [M2 PRD](./03-auth.md)
- 📊 [Backlog](../backlog.md)