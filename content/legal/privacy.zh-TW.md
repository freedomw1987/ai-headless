---
title: 隱私權政策
version: 1.0.0
effectiveDate: 2026-09-05
---

# ai-headless 隱私權政策

**最後更新**：2026 年 9 月 5 日
**版本**：1.0.0

## 1. 我們收集的資料

- **帳號資料**：email、姓名（選填）、密碼（加密儲存）
- **使用資料**：API 呼叫記錄、chat 對話、extensions 設定
- **技術資料**：IP 位址、user agent、request ID（用於除錯）

## 2. 資料用途

- 提供與改善本服務
- 安全性監控（Sentry 錯誤追蹤）
- 客戶支援回應
- 法務合規

**我們不會出售你的資料給第三方。**

## 3. 資料保留

- 帳號資料：帳號刪除後 30 天內清除
- 使用資料：保留 12 個月（除錯與改善）
- Chat 對話：保留 90 天

## 4. 第三方服務

我們使用：

- **Vercel / Neon**（hosting + database）
- **Sentry**（錯誤監控）
- **Resend / nodemailer SMTP**（email 寄送）
- **OpenAI / Anthropic**（AI provider，使用你提供的 API key）

這些服務可能會收到必要的技術資料。

## 5. 你的權利

你有權：

- 查詢我們持有你的哪些資料
- 修正不正確的資料
- 刪除你的帳號與資料
- 匯出你的資料（JSON 格式）
- 撤回同意

請來信 privacy@ai-headless.local 行使權利。

## 6. Cookie 使用

我們使用：

- **必要 cookie**：session、csrf token
- **分析 cookie**：無
- **廣告 cookie**：無

## 7. 安全性

- 密碼以 bcrypt 加密儲存
- 所有傳輸使用 HTTPS
- CSRF token 防跨站攻擊（Sprint 57）
- Request ID 串聯所有 log 與錯誤

## 8. 政策變更

重大變更將提前 30 天透過 email 通知。

## 9. 聯絡我們

隱私相關問題：privacy@ai-headless.local
