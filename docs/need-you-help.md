# Need Your Help — Trust Mode 期間的擔憂清單

> **建立時間**: 2026-09-05 10:55
> **用途**: Trust Mode 期間 Agent 主動記錄的擔憂，每條需要用戶給指示（繼續做 / 改設計 / 跳過）
> **更新規則**: Trust Mode 期間 append；Agent 不會自動停下等用戶，會繼續執行下一個 Backlog

---

## ⚠️ Sprint 56 擔憂

### 1. SMTP 服務選擇

**Backlog**: R2 SMTP 設定（Sprint 56-0，0.3 SP）

**擔憂**: 三個選項各有 trade-off

- **nodemailer + SMTP**：通用，但需用戶自備 SMTP 帳號
- **Resend SDK**：API 簡單，但鎖定單一廠商
- **SendGrid SDK**：類似 Resend，但 API 較複雜

**影響範圍**: P0-1 / P0-2 都依賴此

**建議**: Sprint 56 採 **nodemailer + 預設 SMTP 設定**，文件說明用 Resend。讓用戶後續可換 SDK。

**抉擇**:

- [x] Agent 已決：nodemailer + 預設 SMTP（可推翻）
- [ ] 用戶改用 Resend SDK
- [ ] 用戶改用 SendGrid SDK
- [ ] 跳過（不做 email 相關功能）

---

### 2. Email template 方案

**Backlog**: P0-1 + P0-2 的 email template

**擔憂**:

- **純字串模板**：零依賴，但維護性差
- **React Email**：30KB+ bundle size，需裝新 package
- **MJML**：額外 build step

**影響範圍**: 兩種 email（驗證 + 重設）

**建議**: Sprint 56 採**純字串模板**（用 table + inline style），不引入新依賴。

**抉擇**:

- [ ] Agent 已決：純字串模板（可推翻）
- [x] 用戶改用 React Email
- [ ] 跳過

---

### 3. 既有未驗證用戶處理

**Backlog**: P0-1 Email Verification 啟用後既有 User 怎麼辦？

**擔憂**: Sprint 56 加 emailVerified 強制檢查後，**所有舊用戶（無 emailVerified）會被擋**

**影響範圍**:

- 既有 admin 用戶（測試帳號、真實早期用戶）
- 可能 5-50 個既有帳號

**建議**: 

- 方案 A：標記為 legacy，給 30 天寬限期（middleware 例外）
- 方案 B：強制全部重驗證（破壞性，可能被罵）
- 方案 C：自動把所有舊用戶標 emailVerified = now（**最簡單但有風險**，誰知道那些 email 是不是真實）

**抉擇**:

- [x] Agent 已決：方案 A（30 天寬限期，向後相容）
- [ ] 用戶改用方案 B
- [ ] 用戶改用方案 C
- [ ] 跳過

---

### 4. Token hash vs 明文

**Backlog**: P0-2 Password Reset Token

**擔憂**:

- **hash（SHA-256）**：reset token 安全性高（DB 洩漏也不會被拿來重設密碼），但需要 URL 解碼後 hash 比對
- **明文**：簡單但 DB 洩漏就完蛋

**建議**: **reset 用 hash**，verify 可用明文（驗證信是一次性 + 已過期，hash 沒差）

**抉擇**:

- [x] Agent 已決：reset hash / verify 明文（可推翻）
- [ ] 統一用 hash
- [ ] 統一用明文
- [ ] 跳過

---

### 5. 2FA / 多因素驗證

**Backlog**: GA 是否需要 2FA（TOTP）？

**擔憂**: 2FA 是**安全加分項**，但不是 GA P0 必修

**影響範圍**:

- 企業客戶會要求
- 個人開發者可能覺得麻煩

**建議**: **Sprint 56 不做 2FA**（P2），留 Sprint 65+ 處理

**抉擇**:

- [x] Agent 已決：Sprint 56 不做（可推翻）
- [ ] 提前到 Sprint 56 做
- [ ] 延後到 Sprint 62+
- [ ] 完全不做（GA 也跳過）

---

### 6. Staging 環境建立時間

**Backlog**: Sprint 63 R9 staging 環境

**擔憂**: Sprint 56-58 期間若無 staging，**只能在 dev 測**。上 production 前風險高

**建議**: Sprint 58 加 staging（Vercel Preview Branches 自動）

**抉擇**:

- [x] Agent 已決：Sprint 58 加 staging（可推翻）
- [ ] Sprint 56 就建
- [ ] Sprint 63 再建

---

## ⚠️ Option A 全路線圖層級的擔憂

### 7. R3 真 Rate Limit 實作

**Backlog**: Sprint 60 P1-6 真 Rate Limit (Vercel KV)

**擔憂**: Vercel KV 是 Vercel 專有，**鎖定平台**。若用戶想 deploy 到其他平台（AWS / GCP / 自架）會卡住

**建議**: Sprint 60 採**介面抽象 + Vercel KV 預設**，文件說明可換 Upstash Redis（相容 API）

**抉擇**:

- [x] Agent 已決：抽象介面 + Vercel KV 預設（可推翻）
- [ ] 統一用 Upstash Redis（跨平台）

---

### 8. R10 Extensions 持久化

**Backlog**: Sprint 60 R10 extensions 持久化到 S3 / Vercel Blob

**擔憂**: Vercel serverless filesystem 是 **ephemeral**，重啟或新實例會丟失本地寫入

**影響範圍**: Sprint 55 完成的「AI 生成 extension」流程產出的檔案

**建議**: Sprint 60 改寫 extension 寫入流程，預設寫 Vercel Blob，dev 環境可選 filesystem

**抉擇**:

- [x] Agent 已決：抽象 Storage 介面 + Vercel Blob 預設（可推翻）
- [ ] 統一寫 GitHub（每次 commit）
- [ ] 統一寫 S3（跨平台）

---

### 9. Multi-tenant 範圍

**Backlog**: Sprint 62 P1-3 multi-tenant skeleton

**擔憂**: Multi-tenant 有 3 種架構（shared DB shared schema / shared DB separate schema / separate DB），選錯很難回頭

**建議**: **shared DB shared schema + organizationId 欄位**（最常見、最易擴展）

**抉擇**: 我想是用戶是可以用這個framework在自己server去部署，所以不會有shared DB 的問題。在License 管理上可以有organizationId

---

### 10. i18n 範圍

**Backlog**: Sprint 62 P1-2 i18n

**擔憂**: 全 i18n 是大工程（每個 UI 字串都要翻譯）。**最少要支援幾種語言？**

**建議**: Sprint 62 **i18n 預備**（架構 + 工具），不做實際翻譯；Sprint 63+ 才開始實際翻譯

**抉擇**:

- [x] Agent 已決：i18n 預備 + 預設 en/zh-TW（可推翻）
- [ ] 只做 en
- [ ] 全做（en/zh-TW/zh-CN/ja）

---

## 🚦 狀態總覽


| 擔憂 #               | 等級    | Agent 預設決策       | 用戶回覆  |
| ------------------ | ----- | ---------------- | ----- |
| 1. SMTP 服務         | 中     | nodemailer       | ⏸ 待回覆 |
| 2. Email template  | 低     | 純字串              | ⏸ 待回覆 |
| 3. 既有未驗證用戶         | **高** | 30 天寬限期          | ⏸ 待回覆 |
| 4. Token hash      | 中     | reset hash       | ⏸ 待回覆 |
| 5. 2FA             | 低     | Sprint 56 不做     | ⏸ 待回覆 |
| 6. Staging 時間      | 中     | Sprint 58        | ⏸ 待回覆 |
| 7. Rate limit 平台   | 中     | 抽象 + Vercel KV   | ⏸ 待回覆 |
| 8. Extensions 持久化  | **高** | 抽象 + Vercel Blob | ⏸ 待回覆 |
| 9. Multi-tenant 架構 | **高** | shared + orgId   | ⏸ 待回覆 |
| 10. i18n 範圍        | 中     | 預備 + en/zh-TW    | ⏸ 待回覆 |


---

**Agent 動作**: 所有預設決策已寫進對應 Plan Gate / Roadmap 草案。Sprint 56 開始執行時如用戶未推翻，按預設決策進行。

**用戶可隨時推翻任何決策** → Agent 會在 trust-log.md 加「📝 事後修改（用戶指示）」記錄。