# PRD: Workflow Engine (Module 1 Sub-system)

> **子模組代號**：M1-WS（Workflow Subsystem）
> **所屬模組**：M1（Framework Core）
> **版本**：1.0.0
> **最後更新**：2026-08-24
> **狀態**：Ready for Sprint 2

---

## 1. 子模組概述

### 1.1 子模組目標

Workflow Engine 提供 ai-headless 框架的**狀態機 / 審批流程能力**。包含：

1. **Workflow DSL**：JSON 規範描述狀態機（見 [json-spec.md §3.8](../specs/json-spec.md)）
2. **Workflow Runtime**：執行狀態轉換、guard 檢查、effect 觸發
3. **Workflow API**：`api.workflow.transition()`、`canTransition()` 等
4. **Workflow UI**：自動渲染狀態切換按鈕、狀態徽章、警告非法轉換
5. **Workflow SDK**：Extension 提供狀態機定義（見 [extension-spec.md §4.6](../specs/extension-spec.md)）

### 1.2 為什麼需要 Workflow Engine？

| 沒有 Workflow Engine | 有 Workflow Engine |
|---|---|
| 狀態邏輯散落在 hook / action 中 | 統一 DSL，易讀、易測試 |
| 開發者手寫 if/else | 框架自動 guard、effect |
| 轉換條件沒有視覺化 | 未來可加 Workflow Designer |
| 每個實體重複寫 | 一次定義，多處使用 |

### 1.3 子模組邊界

| 屬於 M1-WS | 不屬於 M1-WS |
|---|---|
| Workflow DSL 解釋器 | 業務邏輯（在 Extension 中）|
| 狀態轉換執行 | UI 設計器（v2 階段）|
| Guard / Effect / onEnter / onExit | 通知系統（M5 之後）|
| 狀態切換 UI | 審批鏈動態配置（v2）|

---

## 2. 功能清單（Functional Requirements）

### 2.1 FR-1：Workflow DSL

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-1.1 | JSON DSL 解析（states、transitions、guards、effects） | P0 | 3 |
| FR-1.2 | TypeScript Types 定義 | P0 | 1 |
| FR-1.3 | JSON Schema 校驗 | P0 | 1 |
| FR-1.4 | DSL 版本管理 | P2 | 2 |

### 2.2 FR-2：Workflow Runtime

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-2.1 | 註冊狀態機（`api.workflow.registerStateMachine()`） | P0 | 2 |
| FR-2.2 | `canTransition(entity, to)` 檢查合法轉換 | P0 | 2 |
| FR-2.3 | `transition(entity, to, context)` 執行轉換 | P0 | 5 |
| FR-2.4 | `getState(entity)` 取得當前狀態 | P0 | 1 |
| FR-2.5 | Guard 函數自動呼叫 | P0 | 2 |
| FR-2.6 | Effect 函數自動呼叫 | P0 | 2 |
| FR-2.7 | onEnter / onExit 自動呼叫 | P0 | 2 |
| FR-2.8 | 轉換日誌（誰、何時、從哪到哪） | P1 | 3 |
| FR-2.9 | 權限檢查（transition.requires.permission） | P0 | 2 |

### 2.3 FR-3：Workflow UI

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-3.1 | 狀態徽章自動渲染（badge 顏色對應狀態） | P0 | 2 |
| FR-3.2 | 詳情頁顯示可用轉換按鈕 | P0 | 3 |
| FR-3.3 | 不可用轉換隱藏或禁用 | P0 | 1 |
| FR-3.4 | 轉換歷史時間軸 | P1 | 3 |
| FR-3.5 | 警告非法轉換（用戶直接改 URL） | P0 | 2 |

### 2.4 FR-4：Workflow SDK

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-4.1 | StateMachine 介面定義 | P0 | 1 |
| FR-4.2 | StateConfig / TransitionDef types | P0 | 1 |
| FR-4.3 | Guard / Effect 函數 signature | P0 | 1 |
| FR-4.4 | Context 參數（用戶、reason 等） | P0 | 1 |

### 2.5 FR-5：Workflow 測試工具

| FR | 功能描述 | 優先級 | SP |
|---|---|---|---|
| FR-5.1 | 測試 DSL 載入 | P1 | 2 |
| FR-5.2 | 模擬 transition、guard、effect | P1 | 2 |
| FR-5.3 | 驗證狀態機合法性（無死鎖、無不可達狀態） | P2 | 3 |

---

## 3. 非功能需求

### 3.1 性能

- `canTransition()` 檢查時間 < 10ms
- `transition()` 完整執行時間 < 100ms（不包括 effect）
- 狀態機註冊時間 < 50ms

### 3.2 可靠性

- 轉換是**原子操作**（要麼全成功，要麼全失敗）
- Effect 失敗時，整個 transition 回滾（如果業務支持）
- Guard 失敗時，不執行 effect

### 3.3 可觀測性

- 所有 transition 寫日誌
- 可追蹤：誰觸發、為什麼、用哪個 guard/effect
- 未來可接 OpenTelemetry

### 3.4 可擴展性

- 未來支援並行狀態機（一個實體多個獨立狀態）
- 未來支援 Workflow Designer（視覺化編輯）
- 未來支援審批鏈動態配置

---

## 4. 介面設計

### 4.1 Workflow API 物件

```typescript
// lib/workflows/api.ts

export interface WorkflowApi {
  // 註冊狀態機（Extension 啟動時呼叫）
  registerStateMachine<T>(machine: StateMachine<T>): void;

  // 取得當前狀態
  getState<T>(entity: T, machineName?: string): string;

  // 檢查是否可轉換
  canTransition<T>(entity: T, to: string, machineName?: string): Promise<boolean>;

  // 執行轉換（會跑 guard → effect → onExit → onEnter → onTransition hook）
  transition<T>(entity: T, to: string, context?: TransitionContext): Promise<T>;

  // 取得所有合法轉換（給 UI 用）
  getAvailableTransitions<T>(entity: T, machineName?: string): Promise<Transition[]>;
}

export interface TransitionContext {
  user: User;                   // 觸發用戶
  reason?: string;              // 轉換原因
  metadata?: Record<string, any>;
}
```

### 4.2 StateMachine 定義

```typescript
// lib/workflows/types.ts

export interface StateMachine<T> {
  name: string;                // "orderStateMachine"
  initialState: string;
  getState?: (entity: T) => string;  // 預設 entity.status

  states: Record<string, StateConfig<T>>;
  transitions: TransitionDef<T>[];
}

export interface StateConfig<T> {
  label: string;
  description?: string;
  badge?: 'default' | 'success' | 'warning' | 'danger';
  allowedActions?: string[];

  // onEnter / onExit 是 hook 引用
  onEnter?: string;             // {{fn:函數名}}
  onExit?: string;
}

export interface TransitionDef<T> {
  from: string | string[];
  to: string;
  guard?: string;               // {{fn:函數名}}
  effect?: string;              // {{fn:函數名}}
  requires?: {
    permission?: string;
  };
}
```

### 4.3 Transition 執行流程

```
用戶點擊「標記為已付款」
   ↓
UI 呼叫 api.workflow.transition(order, 'paid', { user, reason })
   ↓
[1] 檢查 transition.requires.permission
   ├─ 沒權限 → throw ForbiddenError
   └─ 有權限 → 繼續
   ↓
[2] 取得當前狀態
   ├─ 當前狀態不在 from 清單 → throw InvalidTransitionError
   └─ 合法 → 繼續
   ↓
[3] 執行 guard 函數（如有）
   ├─ guard 返回 false → throw GuardFailedError
   └─ guard 返回 true → 繼續
   ↓
[4] 執行 Effect 前的 onExit hook
   ↓
[5] 更新 entity.status 為 'paid'（DB transaction）
   ↓
[6] 執行 Effect 函數（如有）
   ├─ Effect 失敗 → rollback DB，回滾
   └─ Effect 成功 → 繼續
   ↓
[7] 執行 onEnter hook（已進入新狀態）
   ↓
[8] 執行全域 onTransition hook（如有）
   ↓
[9] 記錄 transition log
   ↓
[10] 返回更新後的 entity
```

### 4.4 UI 整合

```tsx
// components/workflow/status-badge.tsx
'use client';

import { useStateMachine } from '@/lib/workflows/use-state-machine';

export function StatusBadge({ entity, machineName }: any) {
  const state = useStateMachine(entity, machineName);
  const config = state?.config;

  if (!config) return null;

  return (
    <Badge variant={config.badge ?? 'default'}>
      {config.label}
    </Badge>
  );
}
```

```tsx
// components/workflow/transition-buttons.tsx
'use client';

export function TransitionButtons({ entity, machineName }: any) {
  const transitions = useAvailableTransitions(entity, machineName);
  const { user } = useSession();
  const router = useRouter();

  if (transitions.length === 0) return null;

  const handleTransition = async (to: string) => {
    try {
      await api.workflow.transition(entity.id, to, {
        user,
        reason: prompt('請輸入轉換原因：') ?? undefined,
      });
      toast.success('狀態已更新');
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex gap-2">
      {transitions.map((t) => (
        <Button
          key={t.to}
          onClick={() => handleTransition(t.to)}
          variant={t.variant ?? 'outline'}
        >
          {t.label ?? `→ ${t.to}`}
        </Button>
      ))}
    </div>
  );
}
```

---

## 5. 資料模型

```prisma
// 轉換日誌（用於審計、debug、顯示歷史）
model TransitionLog {
  id           String   @id @default(cuid())
  machineName  String   // "orderStateMachine"
  entityType   String   // "Order"
  entityId     String   // orderId
  fromState    String
  toState      String
  userId       String?
  user         User?    @relation(fields: [userId], references: [id])
  reason       String?
  metadata     Json?
  guardResult  Boolean? // guard 函數返回什麼
  effectResult String?  // "success" | "failed"
  createdAt    DateTime @default(now())

  @@index([machineName, entityType, entityId, createdAt])
  @@index([userId])
  @@map("transition_logs")
}
```

---

## 6. 使用者故事

### 6.1 US-WS-01：訂單狀態自動轉換

> **作為** 商家
> **我想要** 點「標記為已付款」按鈕自動走狀態機
> **以便** 不需手動改狀態欄位

**驗收標準**：
- [ ] 訂單詳情頁顯示「標記為已付款」按鈕（在 pending_payment 狀態）
- [ ] 點擊 → 自動執行 guard（驗證付款已收）→ effect（扣庫存、發 Email）
- [ ] 訂單狀態變 paid
- [ ] transition_log 寫入一筆記錄
- [ ] 用戶看到 toast 成功訊息

### 6.2 US-WS-02：審批流程

> **作為** 主管
> **我想要** 在審批佇列看到待審批項目
> **以便** 知道哪些需要我處理

**驗收標準**：
- [ ] 後台有「審批佇列」頁面
- [ ] 列出所有 `state === 'review'` 的項目
- [ ] 可一鍵批准或拒絕
- [ ] 批准後自動走狀態機轉換

### 6.3 US-WS-03：查看轉換歷史

> **作為** 用戶
> **我想要** 看某個實體的狀態變化歷史
> **以便** 追蹤是誰、何時變更的

**驗收標準**：
- [ ] 詳情頁顯示時間軸
- [ ] 每條記錄：時間、用戶、從、到、原因

---

## 7. 測試計劃

### 7.1 單元測試

- [ ] DSL 解析
- [ ] `canTransition()` 各種場景
- [ ] Guard 失敗處理
- [ ] Effect 失敗回滾
- [ ] Permission 檢查

### 7.2 整合測試

- [ ] 完整 transition 流程
- [ ] 並發 transition（同實體兩個用戶同時改）
- [ ] 資料庫 transaction 正確性

### 7.3 E2E 測試

- [ ] 訂單狀態機完整流程
- [ ] 審批佇列 → 批准 → 自動轉換

---

## 8. 開發計劃

### Sprint 2

| Task | FR | SP |
|---|---|---|
| DSL 解析 + Types | FR-1.1~1.3 | 3 |
| StateMachine 註冊 | FR-2.1 | 2 |
| canTransition | FR-2.2 | 2 |
| transition（含 guard/effect/onEnter/onExit） | FR-2.3~2.7 | 8 |
| TransitionLog model | — | 1 |
| Permission 檢查 | FR-2.9 | 2 |
| 狀態徽章 UI | FR-3.1 | 2 |
| 轉換按鈕 UI | FR-3.2 | 3 |
| 非法轉換警告 | FR-3.5 | 2 |
| Workflow SDK types | FR-4 全 | 2 |
| 測試 | — | 5 |

**總計**：32 SP

### Sprint 3

| Task | FR | SP |
|---|---|---|
| 轉換日誌時間軸 UI | FR-3.4 | 3 |
| Workflow 測試工具 | FR-5.1, FR-5.2 | 4 |
| 狀態機合法性校驗 | FR-5.3 | 3 |
| Workflow Designer 雛形（v2） | — | 8 |

---

## 9. 風險與緩解

| 風險 | 影響 | 緩解策略 |
|---|---|---|
| Effect 副作用複雜、回滾困難 | 高 | 強制 Effect 冪等 + 補償 transaction |
| Guard 函數執行時間太長 | 中 | 設 timeout（預設 5s）+ 快取 |
| 狀態機變更影響既有資料 | 高 | 版本化狀態機 + migration script |
| 並發衝突（兩個用戶同時改） | 中 | 樂觀鎖 + DB transaction |

---

## 10. 相關文檔

- 📐 [系統架構](../system-design.md) §13 混合模式架構
- 📝 [JSON 功能規範](../specs/json-spec.md) §3.8 Workflows
- 🔌 [Extension 開發規範](../specs/extension-spec.md) §4.6 Workflow SDK
- 📋 [M1 PRD](./01-framework-core.md) §2.6 FR-6 混合模式 SDK
- 📋 [M3 Blog PRD](./04-blog.md) §6.4 一鍵發布範例

---

**子模組負責人**：TBD
**開發負責人**：TBD
**測試負責人**：TBD