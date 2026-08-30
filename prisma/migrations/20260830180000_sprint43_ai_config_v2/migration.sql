-- Sprint 43 v2.0: AI Config Custom URL 支援
--
-- 變更:
-- 1. 新增 enum AIProviderType (4 種 Provider 類型)
-- 2. AIConfig 加 type 欄位 (default: openai)
-- 3. AIConfig 加 endpointUrl 欄位 (nullable, Custom URL 用)
--
-- 注意: 既有資料 (provider 欄位為 "openai" / "anthropic") 需 migrate 為 type
-- provider 欄位保留 (邏輯 provider name), type 是新欄位

-- CreateEnum
CREATE TYPE "AIProviderType" AS ENUM ('openai', 'claude', 'openai_compatible', 'anthropic_compatible');

-- AlterTable
ALTER TABLE "ai_configs" ADD COLUMN "type" "AIProviderType" NOT NULL DEFAULT 'openai';
ALTER TABLE "ai_configs" ADD COLUMN "endpointUrl" TEXT;

-- Backfill: 把既有 'openai' / 'anthropic' 對應到 enum
-- (DEFAULT 'openai' 已處理 openai, 但 anthropic 需手動更新)
UPDATE "ai_configs"
SET "type" = 'claude'
WHERE "provider" = 'anthropic';