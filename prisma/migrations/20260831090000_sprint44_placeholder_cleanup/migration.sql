-- Sprint 44 Commit A: §4.2 既有 data migration
-- 把 Sprint 43 之前的 placeholder (string reverse) 加密資料清空
-- placeholder 格式: 任意字串 (只有 1-2 段 split by ':')
-- AES-GCM 格式: 3 段 hex (iv:ciphertext:authTag)
--
-- 偵測邏輯: split by ':' 段數 != 3 或任一段不是 hex → 視為 placeholder → 清空
-- 安全檢查: WHERE apiKeyEnc IS NOT NULL AND apiKeyEnc != ''

-- Step 1: 清空 placeholder 格式 (段數 != 3)
UPDATE "ai_configs"
SET "apiKeyEnc" = NULL
WHERE "apiKeyEnc" IS NOT NULL
  AND "apiKeyEnc" != ''
  AND array_length(string_to_array("apiKeyEnc", ':'), 1) != 3;

-- Step 2: 清空 placeholder 格式 (任一段不是 hex)
UPDATE "ai_configs"
SET "apiKeyEnc" = NULL
WHERE "apiKeyEnc" IS NOT NULL
  AND "apiKeyEnc" != ''
  AND EXISTS (
    SELECT 1 FROM unnest(string_to_array("apiKeyEnc", ':')) AS part
    WHERE part !~ '^[0-9a-fA-F]+$'
  );