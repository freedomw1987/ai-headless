# Order Extension（US-204 訂單狀態機範例）

> **目的**：驗證 StateMachine Library 的真實應用（從 DB 載入狀態 + transition + 持久化）
> **對應 backlog**：[US-204 訂單狀態機](../../docs/backlog.md)
> **狀態**：Sprint 8（核心後端 + DB，UI 之後 sprint 補）

---

## 🎯 功能

真實訂單生命週期管理：

```
draft → submit → pending_payment → pay → paid → ship → shipped → complete → completed
                  ↓                    ↓                              ↓
                cancel             refund                          refund
                  ↓                    ↓                              ↓
              cancelled           refunded                        refunded
```

7 個 state、6 個 event、3 個 terminal state。

---

## 📂 結構

```
extensions/order/
├── workflow/
│   └── order-workflow.ts        # 整合 StateMachine + Prisma
└── README.md                    # 本檔

app/api/order/
├── route.ts                     # GET 列表 / POST 建立
├── [id]/route.ts                # GET 詳情 / DELETE
└── [id]/transition/route.ts     # POST 狀態切換（核心）

prisma/schema.prisma             # Order model（已加）
tests/integration/order-workflow.test.ts  # 8 個 workflow 測試
```

---

## 🚀 用法

### 建立訂單

```bash
curl -X POST http://localhost:3000/api/order \
  -H "Content-Type: application/json" \
  -d '{"orderNumber": "O-001", "customer": "Alice", "amount": 50000}'
```

回傳：`{ order: { id, status: "draft", ... } }`

### 觸發狀態切換

```bash
curl -X POST http://localhost:3000/api/order/{id}/transition \
  -H "Content-Type: application/json" \
  -d '{"event": "submit"}'
```

可附 `payload`（會寫入 `stateData`）：

```bash
curl -X POST .../transition \
  -d '{"event": "pay", "payload": {"paidAt": "2026-08-24T10:00:00Z"}}'
```

### 完整生命週期

```bash
# 1. submit (draft → pending_payment)
POST .../transition  {"event": "submit"}

# 2. pay (pending_payment → paid)
POST .../transition  {"event": "pay", "payload": {"paidAt": "..."}}

# 3. ship (paid → shipped)
POST .../transition  {"event": "ship", "payload": {"shippedAt": "..."}}

# 4. complete (shipped → completed)
POST .../transition  {"event": "complete", "payload": {"completedAt": "..."}}
```

### 錯誤處理

```bash
# 無效 transition（draft 不能 ship）
POST .../transition  {"event": "ship"}
# → 400 InvalidTransitionError
# { error: "InvalidTransitionError", machineId: "order", currentState: "draft", event: "ship" }
```

---

## 🏗️ 設計決策

### 為何 StateMachine schema 在程式碼不是 JSON 檔？

- ✅ 編譯期型別檢查
- ✅ IDE autocomplete
- ❌ 無法動態熱替換（取捨）

### 為何 payload 寫入 stateData？

- 狀態機 context 是「跟著 state 走的 metadata」
- 例子：`paidAt`, `shippedAt`, `refundedReason`
- 寫在 `stateData` JSON 欄位，比每個 metadata 一個 DB 欄位更靈活

### 為何 workflow 層 vs 直接 API 寫邏輯？

- workflow 層可重複使用（CLI、scheduler、admin UI、後台管理頁）
- API 只是「workflow 的一個入口」

---

## 🧪 測試

| 類型 | 數量 | 檔案 |
|------|------|------|
| StateMachine 單元 | 20 | `lib/state-machine/state-machine.test.ts`（含 3 個 setState 新測試）|
| Workflow 整合 | 8 | `tests/integration/order-workflow.test.ts`|

總計：**28 個測試** 覆蓋這個 extension。

---

## 📋 未做（後續 sprint）

| ID | 描述 | 預估 SP |
|----|------|---------|
| Order Demo UI | 後台訂單列表 + 詳情頁 + 狀態切換按鈕 | 2 SP |
| Order Email 通知 | transition 後寄 email 給客戶 | 1 SP |
| Order Items 子表 | 一張 order 多個 item（產品 + 數量） | 3 SP |

---

## 💡 設計給未來看的洞見

1. **StateMachine + Prisma 的 pairing 模式**：DB 存「當前狀態」，StateMachine 存「轉移規則」
2. **payload 寫 stateData**：避免 DB schema 膨脹
3. **setState 從 DB 載入**：真實應用場景必備（不是「從零開始」）

---

**建立日期**：2026-08-24（Sprint 8）
**最後更新**：2026-08-24