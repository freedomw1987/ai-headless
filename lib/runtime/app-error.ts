/**
 * AppError class + ErrorCategory enum (Sprint 27 TD-524)
 *
 * 對應 PRD: docs/specs/json-spec.md
 * 對應 Backlog: TD-524 (Sprint 26 reflection 揭露)
 *
 * 問題:
 * - Sanitizer 用 regex 陣列判斷錯誤類型 → 新錯誤訊息需手動加 regex
 * - 訊息變更時 regex 失效 (silent regression)
 * - 無法在 IDE 看到所有「安全訊息」列舉
 *
 * 修正:
 * - AppError class 帶 category field
 * - ErrorCategory enum: VALIDATION / BUSINESS_RULE / EXTENSION / INTERNAL
 * - Sanitizer 改用 instanceof AppError + category
 * - 保留 regex fallback (向後相容舊 throw new Error)
 *
 * 用法:
 *   throw new AppError('Email 必填', ErrorCategory.VALIDATION);
 *   throw new AppError('Cannot register for cancelled event', ErrorCategory.BUSINESS_RULE);
 *   throw new AppError('Extension disabled', ErrorCategory.EXTENSION);
 *   throw new AppError('DB error', ErrorCategory.INTERNAL); // 會被過濾
 *
 *   // 舊風格仍可:
 *   throw new Error('Cannot register');  // 走 regex fallback
 */

/**
 * Error 分類 (決定是否可安全暴露給 client)
 */
export enum ErrorCategory {
  /** Zod / 業務必填 / 格式錯誤 (可安全暴露) */
  VALIDATION = 'VALIDATION',
  /** 業務邏輯錯誤 (可安全暴露,如 Cannot register) */
  BUSINESS_RULE = 'BUSINESS_RULE',
  /** Extension / Hook 守衛錯誤 (可安全暴露,如 Extension disabled) */
  EXTENSION = 'EXTENSION',
  /** 內部錯誤 (Prisma / Network / 不可暴露) */
  INTERNAL = 'INTERNAL',
}

/**
 * AppError — 帶 category 的 Error 子類別
 */
export class AppError extends Error {
  public readonly category: ErrorCategory;
  public override readonly name = 'AppError';

  constructor(message: string, category: ErrorCategory) {
    super(message);
    this.category = category;
    // 保持 prototype chain 正確 (instanceof 運作)
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * 分類錯誤 (sanitizer 內部使用)
 * - AppError → 回傳其 category
 * - 其他 Error / 非 Error → 回傳 'UNKNOWN' (走 regex fallback)
 */
export function classifyError(e: unknown): ErrorCategory | 'UNKNOWN' {
  if (e instanceof AppError) {
    return e.category;
  }
  return 'UNKNOWN';
}

/**
 * Sanitizer V2 (取代舊 sanitizeErrorMessage)
 * - 優先用 AppError.category 判斷
 * - 未知錯誤走 regex fallback (向後相容)
 *
 * 規則:
 * - VALIDATION / BUSINESS_RULE / EXTENSION → 直接回傳 message
 * - INTERNAL → 過濾為「提交失敗，請檢查輸入」
 * - UNKNOWN (非 AppError) → 走 regex SAFE_PATTERNS
 * - dev mode → 全部保留原始 message
 */
export function sanitizeErrorMessageV2(e: unknown): string {
  const raw = e instanceof Error ? e.message : '提交失敗';

  // Dev: 保留原始訊息
  if (process.env.NODE_ENV !== 'production') {
    return raw;
  }

  // Production: 優先用 category
  const category = classifyError(e);
  if (category === 'VALIDATION' || category === 'BUSINESS_RULE' || category === 'EXTENSION') {
    return raw;
  }
  if (category === 'INTERNAL') {
    return '提交失敗，請檢查輸入';
  }

  // Fallback: 走 regex SAFE_PATTERNS (向後相容)
  return sanitizeWithRegex(raw);
}

/**
 * Regex fallback (向後相容舊 throw new Error)
 */
function sanitizeWithRegex(raw: string): string {
  const SAFE_PATTERNS = [
    /Required/i,
    /Invalid input/i,
    /must be/i,
    /must not/i,
    /^Event /,
    /^Todo /,
    /^Blog /,
    /Cannot register/i,
    /StateMachine/i,
    /Extension .* (is disabled|not enabled)/i,
    /必填/,
    /格式/,
    /無法/,
    /不能/,
  ];
  if (SAFE_PATTERNS.some((re) => re.test(raw))) {
    return raw;
  }
  return '提交失敗，請檢查輸入';
}