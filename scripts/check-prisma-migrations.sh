#!/usr/bin/env bash
# ============================================================
# scripts/check-prisma-migrations.sh
# ============================================================
#
# 用途：
#   - CI gate: 確保 migration history 跟 DB schema 同步
#   - 防止「migration 在 prisma/migrations 但 DB 沒套用」的狀態
#
# 用法：
#   bash scripts/check-prisma-migrations.sh
#
# Exit code：
#   0 = 全部 migrations 已套用，DB schema up-to-date
#   1 = 有 pending migrations 或 DB schema drift
#
# 對應 P0-7：Sprint 59 Plan Gate §0
# 對應 SOP §2.3 Gate 3：regression gate 必跑

set -euo pipefail

# 確保 .env.local 已載入 (DATABASE_URL)
if [[ -f .env.local ]]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env.local
  set +a
fi

# 檢查 DATABASE_URL 是否設定
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL 未設定。請設定 .env.local 或環境變數" >&2
  exit 1
fi

echo "📋 檢查 Prisma migration 狀態..."

# 用 prisma migrate status 檢查
# 輸出最後一行是 summary："Database schema is up to date!" 或 "X migrations have not yet been applied"
STATUS_OUTPUT=$(pnpm prisma migrate status 2>&1)
STATUS_EXIT=$?

# 把 output 印出來（方便 CI log）
echo "$STATUS_OUTPUT"

if [[ $STATUS_EXIT -ne 0 ]]; then
  echo "" >&2
  echo "❌ prisma migrate status 失敗（exit $STATUS_EXIT）" >&2
  exit 1
fi

# 檢查是否有 pending migrations
if echo "$STATUS_OUTPUT" | grep -q "have not yet been applied"; then
  echo "" >&2
  echo "❌ 有 pending migrations。請先跑：" >&2
  echo "   pnpm prisma migrate deploy" >&2
  exit 1
fi

# 檢查最後 summary
if ! echo "$STATUS_OUTPUT" | grep -q "Database schema is up to date"; then
  echo "" >&2
  echo "❌ DB schema 不是 up to date。請跑 prisma migrate diff 排查 schema drift" >&2
  exit 1
fi

echo ""
echo "✅ DB schema up to date，no pending migrations"
exit 0
