# Todo Extension

> **名稱**：todo（待辦事項）
> **版本**：1.0.0
> **模組**：M3 Blog 系列
> **展示能力**：極簡 CRUD + Hook（自動驗證）+ Computed（剩餘天數）

## 📋 功能

- **CRUD**：建立 / 列表 / 編輯 / 刪除 / 完成待辦
- **Hook `beforeCreate`**：自動 trim title + 設定預設 dueDate（+7 天）
- **Computed `remainingDays`**：計算到截止日的剩餘天數
- **Action `complete`**：一鍵標記為完成 + 記錄完成時間

## 📁 結構

```
extensions/todo/
├── manifest.json          # Extension 描述
├── todo-spec.json         # JsonSpec（自動生成的 Prisma/API/UI 來源）
├── hooks/
│   └── before-create.ts   # 自動 trim title + 設定 dueDate
├── actions/
│   └── complete.ts        # 標記完成
├── computed/
│   └── remaining-days.ts  # 計算剩餘天數
└── README.md
```

## 🚀 使用

```bash
# 載入 Extension
bunx tsx scripts/load-extension.ts todo
```

## 🧪 測試

```bash
bunx vitest --run tests/integration/todo-extension.test.ts
```

## 📊 JsonSpec 摘要

| 欄位 | 類型 | 必填 | UI | 說明 |
|---|---|---|---|---|
| `title` | string | ✅ | editable | 待辦標題 |
| `description` | text | ❌ | editable | 詳細描述 |
| `completed` | boolean | ✅ | listable | 是否完成 |
| `dueDate` | datetime | ❌ | editable | 截止日期 |
| `priority` | enum | ❌ | listable | 優先級（low/medium/high）|
| `remainingDays` | computed | — | listable | 剩餘天數（自動計算）|