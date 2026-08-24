# Event Extension

> **名稱**：event（活動管理）
> **版本**：1.0.0
> **模組**：M3 Blog 系列
> **展示能力**：datetime + 多對多 Relation + 容量 Hook + 狀態機 Workflow

## 📋 功能

- **CRUD**：建立 / 列表 / 編輯 / 刪除活動
- **Hook `beforeCreate`**：驗證 `endAt > startAt`
- **Hook `beforeRegister`**：檢查容量 + 重複報名
- **Computed**：`availableSeats` / `isFull` / `isUpcoming`
- **Action `registerAttendee`**：報名活動
- **Action `cancelEvent`**：取消活動
- **Workflow `event.lifecycle`**：upcoming → ongoing → past / cancelled

## 📁 結構

```
extensions/event/
├── manifest.json
├── event-spec.json                # 含 Event + Registration 兩個 Model
├── hooks/
│   ├── before-create.ts           # 驗證日期
│   └── before-register.ts         # 檢查容量 + 重複報名
├── actions/
│   ├── register-attendee.ts       # 報名
│   └── cancel-event.ts            # 取消
├── computed/
│   ├── available-seats.ts         # 剩餘名額
│   ├── is-full.ts                 # 是否已滿
│   └── is-upcoming.ts             # 是否即將開始
├── workflows/
│   └── lifecycle.ts               # 活動狀態機
└── README.md
```

## 🚀 使用

```bash
# 載入 Extension
bunx tsx scripts/load-extension.ts event
```

## 🧪 測試

```bash
bunx vitest --run tests/integration/event-extension.test.ts
```

## 📊 Models 摘要

### Event
| 欄位 | 類型 | 必填 | 說明 |
|---|---|---|---|
| `title` | string | ✅ | 活動標題 |
| `description` | text | ❌ | 活動描述 |
| `startAt` | datetime | ✅ | 開始時間 |
| `endAt` | datetime | ✅ | 結束時間 |
| `location` | string | ❌ | 地點 |
| `capacity` | integer | ❌ | 容量（0 = 不限）|
| `status` | enum | ✅ | upcoming/ongoing/past/cancelled |

### Registration（中間表）
| 欄位 | 類型 | 說明 |
|---|---|---|
| `eventId` | reference | 活動 ID |
| `userId` | reference | 報名者 ID |
| `registeredAt` | datetime | 報名時間 |