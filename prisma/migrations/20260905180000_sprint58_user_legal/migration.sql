-- ==============================================
--  Sprint 58 — User 法務合規 + Onboarding 欄位
-- ==============================================
--
-- 對應 docs/sprint58-plan-gate.md §2 + §3
--
-- 新增欄位（全部 optional，不破壞既有資料）：
--   - onboardingStep: Int, default 0 (0 = 未開始, 1-4 = 步驟進度, 99 = 完成)
--   - acceptedTosVersion: 註冊時同意的 ToS 版本
--   - acceptedPrivacyVersion: 註冊時同意的 Privacy 版本
--   - tosAcceptedAt: 同意時間戳（audit 用）

ALTER TABLE "users"
  ADD COLUMN "onboardingStep" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "acceptedTosVersion" TEXT,
  ADD COLUMN "acceptedPrivacyVersion" TEXT,
  ADD COLUMN "tosAcceptedAt" TIMESTAMP(3);
